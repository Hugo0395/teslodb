/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image: string) =>
          this.productImageRepository.create({ url: image }),
        ),
      });
      await this.productRepository.save(product);
      return { ...product, images };
    } catch (error) {
      this.handleDbExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const products = await this.productRepository.find({
        skip: paginationDto.offset || 0,
        take: paginationDto.limit || 10,
        relations: {
          images: true,
        },
      });
      return products.map((product) => ({
        ...product,
        images: product.images?.map((img) => img.url),
      }));
    } catch (error) {
      this.handleDbExceptions(error);
    }
  }

  async findOne(term: string) {
    let product: Product | null;
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({
        id: term,
      });
    } else {
      // product = await this.productRepository.findOneBy({
      //   slug: term,
      // });
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where(`UPPER(title) =:title or slug =:slug`, {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    // const product = await this.productRepository.findOneBy({
    //   id: term,
    // });
    if (!product) {
      throw new NotFoundException('No product found for id ' + term);
    }
    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...product } = await this.findOne(term);
    return {
      ...product,
      images: images?.map((img) => img.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;

    // Busca el id y carga los datos del producto
    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
    });

    if (!product) {
      throw new NotFoundException('No product found for id ' + id);
    }

    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        //Eliminar todas las imágenes asociadas al producto
        await queryRunner.manager.delete(ProductImage, { product: { id: id } });

        product.images = images.map((image: string) =>
          this.productImageRepository.create({ url: image }),
        );
      } else {
        // Mantener las imágenes existentes
        product.images = await this.productImageRepository.findBy({
          product: { id: id },
        });
      }
      await queryRunner.manager.save(product);
      // return await this.productRepository.save(product);
      //Hace que el producto se guarde en la base de datos
      await queryRunner.commitTransaction();
      // Libera el query runner después de la transacción
      await queryRunner.release();
      return { ...product, images: product.images?.map((img) => img.url) };
    } catch (error) {
      // Si ocurre un error, revierte la transacción y libera el query runner
      await queryRunner.rollbackTransaction();
      // Libera el query runner después de la transacción
      await queryRunner.release();
      this.handleDbExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    if (product) {
      try {
        await this.productRepository.delete(id);
        return { message: 'Product deleted successfully' };
      } catch (error) {
        this.handleDbExceptions(error);
      }
    }
  }

  private handleDbExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    if (error.code === '22P02') {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('AYUDAAAA');
  }
}
