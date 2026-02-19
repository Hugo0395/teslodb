import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductImage {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column('text')
  url!: string;

  // Relación ManyToOne: Muchas imágenes pertenecen a un solo producto
  // () => Product: Especifica la entidad relacionada (el lado "uno")
  // (product) => product.images: La propiedad inversa en Product que contiene el array de imágenes
  // onDelete: 'CASCADE': Si se elimina el Product padre, esta imagen se elimina automáticamente de la BD
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  product!: Product;
}
