import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../products/dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly productsService: ProductsService) {}

  findAll() {
    return this.productsService.findAllCategories();
  }

  findOne(id: string) {
    return this.productsService.findCategoryById(id);
  }

  create(dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.productsService.updateCategory(id, dto);
  }

  remove(id: string) {
    return this.productsService.deleteCategory(id);
  }
}
