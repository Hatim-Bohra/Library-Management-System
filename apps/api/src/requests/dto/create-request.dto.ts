import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { BookRequestType } from '@repo/database';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @IsUUID()
  @IsNotEmpty()
  bookId!: string;

  @IsEnum(BookRequestType)
  @IsNotEmpty()
  type!: BookRequestType;

  @IsString()
  @IsOptional()
  address?: string;
  @ApiProperty({ example: '2023-01-01', description: 'Desired return date (optional)' })
  @IsOptional()
  @IsDateString()
  returnDate?: string;
}
