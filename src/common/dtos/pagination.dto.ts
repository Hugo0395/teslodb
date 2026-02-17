import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  //  el offset lo valida como número entero positivo, es decir el minimo es 0 y debe ser positivo
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number) // convertir a número
  offset?: number;
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number;
}
