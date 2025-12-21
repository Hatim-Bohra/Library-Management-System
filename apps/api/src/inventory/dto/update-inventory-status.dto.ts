import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemStatus } from '@prisma/client';

export class UpdateInventoryStatusDto {
  @ApiProperty({ enum: ItemStatus })
  @IsEnum(ItemStatus)
  @IsNotEmpty()
  status!: ItemStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
