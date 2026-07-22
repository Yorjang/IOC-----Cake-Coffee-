import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CreateProductTagDto, UpdateProductTagDto } from '../products/dto/product-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly productsService: ProductsService) {}

  findAll() {
    return this.productsService.findAllTags();
  }

  findOne(id: string) {
    return this.productsService.findTagById(id);
  }

  create(dto: CreateProductTagDto) {
    return this.productsService.createTag(dto);
  }

  update(id: string, dto: UpdateProductTagDto) {
    return this.productsService.updateTag(id, dto);
  }

  remove(id: string) {
    return this.productsService.deleteTag(id);
  }
}
