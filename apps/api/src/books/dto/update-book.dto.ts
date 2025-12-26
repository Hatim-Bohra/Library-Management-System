import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';
import { IsBoolean, IsOptional, IsInt, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookDto extends PartialType(CreateBookDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  coverImageSize?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  coverImageMime?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  rentalPrice?: number;
}
