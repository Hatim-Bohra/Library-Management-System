import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookDto extends PartialType(CreateBookDto) {
    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;
}
