import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  isbn!: string;

  @ApiProperty()
  @IsInt()
  @Min(1000)
  publishedYear!: number;

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(0)
  copies!: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  authorId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}
