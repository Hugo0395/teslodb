//representacion de la tabla de la base de datos
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { ProductImage } from './product-image.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column('text', {
    unique: true,
  })
  title!: string;
  @Column('float', {
    default: 0,
  })
  price!: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column('text', {
    unique: true,
  })
  slug!: string;

  @Column({
    type: 'int',
    default: 0,
  })
  stock!: number;

  @Column({
    type: 'text',
    array: true,
  })
  sizes!: string[];

  @Column({
    type: 'text',
  })
  gender!: string;

  @Column({
    type: 'text',
    array: true,
    default: [],
  })
  tags!: string[];

  // @OneToMany(
  //   () => ProductImage,
  //   (productImage) => productImage.product,
  //   {
  //   cascade: true,
  // })
  // images?: ProductImage;

  //Antes de insertar un nuevo producto, se verifica si el slug está vacío. Si es así, se asigna el título del producto al slug. Luego, se formatea el slug convirtiéndolo a minúsculas, reemplazando los espacios por guiones bajos y eliminando los apóstrofes. Esto asegura que el slug sea único y esté en un formato adecuado para su uso en URLs.
  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^a-z0-9\s]/g, '') // elimina símbolos
      .trim()
      .replace(/\s+/g, '_'); // espacios → _
  }
}
