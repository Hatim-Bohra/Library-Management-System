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
  authorName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  coverUrl?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  coverImageSize?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  coverImageMime?: string;
}
