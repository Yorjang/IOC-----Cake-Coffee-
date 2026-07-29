import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviews: Repository<Review>,
    private readonly ordersService: OrdersService,
  ) {}

  async findAll(): Promise<Review[]> {
    return this.reviews.find({
      relations: { user: true, product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateVisibility(id: string, isVisible: boolean): Promise<Review> {
    const review = await this.reviews.findOne({ where: { id } });
    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại.');
    }
    review.isVisible = isVisible;
    return this.reviews.save(review);
  }

  async delete(id: string): Promise<{ message: string }> {
    const review = await this.reviews.findOne({ where: { id } });
    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại.');
    }
    await this.reviews.delete(id);
    return { message: 'Xóa đánh giá thành công.' };
  }

  async findByProduct(productId: string): Promise<Review[]> {
    return this.reviews.find({
      where: { productId, isVisible: true },
      relations: { user: true },
      order: { createdAt: 'DESC' }
    });
  }

  async createReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    const { productId, rating, comment } = dto;
    
    const hasPurchased = await this.ordersService.hasPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      throw new BadRequestException('Bạn cần mua sản phẩm này và hoàn thành đơn hàng trước khi đánh giá.');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5 sao.');
    }
    const review = this.reviews.create({
      productId,
      userId,
      rating,
      comment,
      isVerified: true,
      isVisible: true
    });
    const saved = await this.reviews.save(review);
    return this.reviews.findOne({
      where: { id: saved.id },
      relations: { user: true }
    });
  }

  async checkEligibility(userId: string, productId: string): Promise<{ eligible: boolean }> {
    const hasPurchased = await this.ordersService.hasPurchasedProduct(userId, productId);
    return { eligible: hasPurchased };
  }
}
