import { describe, expect, it } from '@jest/globals';
import { Product, ProductType } from '../products/product.entity';
import { ChatService } from './chat.service';

interface SearchableChatService {
  normalizeSearchText(value: string): string;
  extractSearchTerms(normalizedText: string): string[];
  matchesSearchTerms(product: Product, terms: string[]): boolean;
  scoreSearchTerms(product: Product, terms: string[]): number;
  formatAnswer(answer: string, fallback: string): string;
}

describe('ChatService product matching', () => {
  const service = Object.create(ChatService.prototype) as SearchableChatService;

  it('should match an accented Vietnamese product with normalized search terms', () => {
    const product = {
      name: 'Bánh quy bơ Pháp',
      description: 'Bánh quy thơm vị bơ',
      ingredientsInfo: 'Bơ, bột mì, đường',
      productType: ProductType.CAKE,
      category: { name: 'Bánh ngọt' },
    } as Product;
    const normalizedQuestion = service.normalizeSearchText('Giới thiệu chi tiết cho tôi bánh quy bơ pháp');
    const terms = service.extractSearchTerms(normalizedQuestion);

    expect(terms).toContain('bo');
    expect(service.matchesSearchTerms(product, terms)).toBe(true);
    expect(service.scoreSearchTerms(product, terms)).toBeGreaterThan(terms.length);
  });

  it('should not match an unrelated product', () => {
    const product = {
      name: 'Cà phê Americano',
      description: 'Cà phê đen',
      ingredientsInfo: 'Espresso, nước',
      productType: ProductType.COFFEE,
      category: { name: 'Cà phê' },
    } as Product;
    const terms = service.extractSearchTerms(
      service.normalizeSearchText('bánh quy bơ pháp'),
    );

    expect(service.matchesSearchTerms(product, terms)).toBe(false);
  });

  it('should keep AI answers focused within three short lines', () => {
    const answer = [
      'Bánh mousse dâu tây có vị chua ngọt nhẹ.',
      'Bánh dùng kem mềm và dâu tây.',
      'Giá hiện có trong biến thể sản phẩm.',
      'Bạn có muốn mình giới thiệu thêm món khác không?',
    ].join(' ');

    const result = service.formatAnswer(answer, 'Không có dữ liệu.');

    expect(result.split('\n')).toHaveLength(3);
    expect(result).not.toContain('giới thiệu thêm');
    expect(result.length).toBeLessThanOrEqual(220);
  });

  it('should normalize spaces inside Vietnamese prices and before punctuation', () => {
    const result = service.formatAnswer(
      'Giá là 45. 000đ , nguyên ổ 120. 000đ !',
      'Không có dữ liệu.',
    );

    expect(result).toBe('Giá là 45.000đ, nguyên ổ 120.000đ!');
  });
});
