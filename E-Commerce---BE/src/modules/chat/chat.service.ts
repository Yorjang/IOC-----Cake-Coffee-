import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import OpenAI from 'openai';
import { Brackets, Repository } from 'typeorm';
import { Product, ProductType } from '../products/product.entity';
import { VariantStatus } from '../products/product-variant.entity';
import { ChatMessage, ChatMessageRole } from './chat-message.entity';
import { ChatSession } from './chat-session.entity';

interface ChatProductContext {
  name: string;
  type: string;
  description: string;
  ingredients: string;
  variants: string[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI | null;

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly configService: ConfigService,
  ) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const apiKey = geminiKey || openaiKey;
    const baseURL = geminiKey
      ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
      : this.configService.get<string>('OPENAI_BASE_URL') || undefined;
    this.openai = apiKey ? new OpenAI({ apiKey, baseURL }) : null;
    if (!this.openai) {
      this.logger.warn('No AI API key is configured; chatbot will use product-rule fallback.');
    } else if (geminiKey) {
      this.logger.log('Chat AI provider: Gemini OpenAI-compatible API');
    }
  }

  async createSession(): Promise<ChatSession> {
    return this.sessions.save(this.sessions.create({ title: 'Tư vấn sản phẩm', userId: null }));
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    await this.getSession(sessionId);
    return this.messages.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  async sendMessage(sessionId: string, message: string): Promise<{ sessionId: string; message: ChatMessage }> {
    await this.getSession(sessionId);
    const normalizedMessage = message.trim();
    const userMessage = await this.messages.save(this.messages.create({
      sessionId,
      role: ChatMessageRole.USER,
      content: normalizedMessage,
    }));

    const history = await this.messages.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const products = await this.findRelevantProducts(normalizedMessage, history);
    const answer = await this.generateAnswer(normalizedMessage, products, history.reverse());

    const assistantMessage = await this.messages.save(this.messages.create({
      sessionId,
      role: ChatMessageRole.ASSISTANT,
      content: answer,
    }));

    return { sessionId, message: assistantMessage };
  }

  private async getSession(sessionId: string): Promise<ChatSession> {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Không tìm thấy phiên trò chuyện');
    return session;
  }

  private async findRelevantProducts(message: string, history: ChatMessage[]): Promise<ChatProductContext[]> {
    const searchText = [
      message,
      ...history
        .filter(item => item.role === ChatMessageRole.USER)
        .map(item => item.content),
    ].join(' ');
    const normalized = this.normalizeSearchText(searchText);
    const productType = this.detectProductType(normalized);
    const maxPrice = this.extractBudget(normalized);
    const wantsCheap = /\b(re|gia tot|tiet kiem|binh dan|ngan sach)\b/u.test(normalized);
    const stopWords = new Set([
      'cho', 'toi', 'minh', 'ban', 'tu', 'van', 'loai', 'mon', 'co', 'the',
      'theo', 'ngan', 'sach', 'ngon', 'bo', 'roi', 'nhe', 'nhe', 'muon',
    ]);
    const terms = [...new Set(
      normalized
        .split(/\s+/)
        .filter(term => term.length >= 2 && !stopWords.has(term)),
    )].slice(0, 8);

    // A greeting or a follow-up without a product intent should not return
    // arbitrary products from the catalog.
    if (!productType && terms.length === 0 && maxPrice === null) return [];

    const query = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variant', 'variant.status = :variantStatus', {
        variantStatus: VariantStatus.ACTIVE,
      })
      .where('product.is_active = true');

    if (productType) {
      query.andWhere('product.product_type = :productType', { productType });
    }

    if (maxPrice !== null) {
      query.andWhere('variant.price <= :maxPrice', { maxPrice });
    }

    query.orderBy(wantsCheap || maxPrice !== null ? 'variant.price' : 'product.name', 'ASC')
      .take(8);

    if (terms.length > 0) {
      query.andWhere(new Brackets(builder => {
        terms.forEach((term, index) => {
          const condition = [
            `product.name ILIKE :term${index}`,
            `product.description ILIKE :term${index}`,
            `product.ingredients_info ILIKE :term${index}`,
            `category.name ILIKE :term${index}`,
          ].join(' OR ');
          if (index === 0) builder.where(`(${condition})`, { [`term${index}`]: `%${term}%` });
          else builder.orWhere(`(${condition})`, { [`term${index}`]: `%${term}%` });
        });
      }));
    }

    const products = await query.getMany();
    return products.map(product => ({
      name: product.name,
      type: product.productType,
      description: product.description || 'Chưa có mô tả',
      ingredients: product.ingredientsInfo || 'Chưa cập nhật',
      variants: (product.variants || []).map(variant => {
        const name = variant.variantName.startsWith(product.name)
          ? variant.variantName.slice(product.name.length).replace(/^\s*[-–—:]\s*/u, '')
          : variant.variantName;
        return `${name}${variant.size ? ` (${variant.size})` : ''}: ${Number(variant.price).toLocaleString('vi-VN')}đ`;
      }),
    }));
  }

  private normalizeSearchText(value: string): string {
    return value
      .toLocaleLowerCase('vi')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private detectProductType(text: string): ProductType | null {
    if (/\b(cafe|ca phe|coffee|latte|espresso|americano|bac xiu|capuchino)\b/u.test(text)) {
      return ProductType.COFFEE;
    }
    if (/\b(banh|cake|mousse|tiramisu)\b/u.test(text)) return ProductType.CAKE;
    if (/\b(tra|tea|nuoc|drink|soda|sinh to|nuoc ep)\b/u.test(text)) return ProductType.DRINK;
    if (/\b(combo|set)\b/u.test(text)) return ProductType.COMBO;
    return null;
  }

  private extractBudget(text: string): number | null {
    const match = text.match(/(?:duoi|tam|khoang|ngan sach|gia)[^\d]{0,20}(\d[\d\s]*)(?:\s*(k|nghin|ngan|trieu|d|dong))?/u);
    if (!match) return null;

    const value = Number(match[1].replace(/\s/g, ''));
    if (!Number.isFinite(value) || value <= 0) return null;
    const unit = match[2] || '';
    if (unit === 'trieu') return value * 1_000_000;
    if (unit === 'k' || unit === 'nghin' || unit === 'ngan') return value * 1_000;
    return value;
  }

  private async generateAnswer(
    question: string,
    products: ChatProductContext[],
    history: ChatMessage[],
  ): Promise<string> {
    if (!this.openai) return this.buildFallbackAnswer(products, question);

    const productContext = JSON.stringify(products, null, 2);
    const conversation = history
      .map(item => `${item.role === ChatMessageRole.USER ? 'Khách' : 'Tư vấn viên'}: ${item.content}`)
      .join('\n');

    try {
      // Gemini's OpenAI-compatible endpoint supports Chat Completions,
      // while the native OpenAI provider below uses the Responses API.
      if (this.configService.get<string>('GEMINI_API_KEY')) {
        const response = await this.openai.chat.completions.create({
          model: this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.1-flash-lite',
          messages: [
            {
              role: 'system',
              content: 'Bạn là nhân viên tư vấn Sweet Bean Coffee & Cake. Chỉ dùng dữ liệu sản phẩm được cung cấp, trả lời tiếng Việt thân thiện và ngắn gọn.',
            },
            {
              role: 'user',
              content: `Danh sách sản phẩm liên quan:\n${productContext}\n\nLịch sử hội thoại:\n${conversation || '(chưa có)'}\n\nCâu hỏi mới của khách:\n${question}`,
            },
          ],
        });
        const content = response.choices[0]?.message?.content;
        return (typeof content === 'string' ? content.trim() : '') || this.buildFallbackAnswer(products, question);
      }

      const response = await this.openai.responses.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-5',
        store: false,
        instructions: [
          'Bạn là nhân viên tư vấn của Sweet Bean Coffee & Cake.',
          'Chỉ sử dụng thông tin trong danh sách sản phẩm được cung cấp; không tự bịa giá, tồn kho hoặc chính sách.',
          'Trả lời bằng tiếng Việt, thân thiện, ngắn gọn. Nếu không đủ dữ liệu, hãy nói rõ và đề nghị khách liên hệ nhân viên.',
          'Không yêu cầu hoặc tiết lộ mật khẩu, API key, dữ liệu thanh toán hay thông tin nhạy cảm.',
        ].join('\n'),
        input: `Danh sách sản phẩm liên quan:\n${productContext}\n\nLịch sử hội thoại:\n${conversation || '(chưa có)'}\n\nCâu hỏi mới của khách:\n${question}`,
      });
      return response.output_text?.trim() || this.buildFallbackAnswer(products, question);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chat AI request failed: ${detail}`);
      return this.buildFallbackAnswer(products, question);
    }
  }

  private buildFallbackAnswer(products: ChatProductContext[], question = ''): string {
    const normalizedQuestion = this.normalizeSearchText(question);
    if (/^(xin chao|hello|hi|hey)( ban)?$/u.test(normalizedQuestion)) {
      return 'Xin chào! Mình có thể tư vấn bánh, cà phê, trà theo khẩu vị và ngân sách của bạn.';
    }

    if (products.length === 0) {
      return 'Mình chưa tìm thấy sản phẩm phù hợp trong danh mục hiện tại. Bạn có thể cho mình biết thêm ngân sách, khẩu vị hoặc dịp sử dụng nhé.';
    }

    const suggestions = products.slice(0, 4).map(product => {
      const variant = product.variants[0] ? ` – ${product.variants[0]}` : '';
      return `• ${product.name}${variant}`;
    });
    return `Mình gợi ý bạn tham khảo:\n${suggestions.join('\n')}\n\nBạn muốn mình tư vấn theo khẩu vị, ngân sách hay dịp sử dụng?`;
  }
}
