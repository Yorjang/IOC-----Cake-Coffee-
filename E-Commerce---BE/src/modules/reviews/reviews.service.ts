import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  async findAll(): Promise<Review[]> {
    return this.reviewsRepository.find({
      relations: { user: true, product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateVisibility(id: string, isVisible: boolean): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại.');
    }
    review.isVisible = isVisible;
    return this.reviewsRepository.save(review);
  }

  async delete(id: string): Promise<{ message: string }> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại.');
    }
    await this.reviewsRepository.delete(id);
    return { message: 'Xóa đánh giá thành công.' };
  }
}
