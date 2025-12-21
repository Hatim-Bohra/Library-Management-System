import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddInventoryDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    barcode!: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    location?: string;
}
