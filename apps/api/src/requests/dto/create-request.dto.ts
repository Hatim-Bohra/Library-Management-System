import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { BookRequestType } from '@repo/database';

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
}
