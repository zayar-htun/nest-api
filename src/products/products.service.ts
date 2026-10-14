import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProductsDto } from './dto/update-products-dto.js';
import { CreateProductsDto } from './dto/create-products-dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.product.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  async getOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: number, updateProductsDto: UpdateProductsDto) {
    await this.getOne(id);

    return this.prisma.product.update({
      where: {
        id,
      },
      data: {
        name: updateProductsDto.name,
        price: updateProductsDto.price,
        description: updateProductsDto.description,
        stock: updateProductsDto.stock,
      },
    });
  }

  async create(createProductsDto: CreateProductsDto) {
    return this.prisma.product.create({
      data: {
        name: createProductsDto.name,
        price: createProductsDto.price,
        description: createProductsDto.description,
        stock: createProductsDto.stock,
      },
    });
  }

  async remove(id: number) {
    await this.getOne(id);

    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }
}
