import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateLoanDto {
    @ApiProperty({ example: 'uuid-user-id' })
    @IsUUID()
    @IsNotEmpty()
    userId!: string;

    @ApiProperty({ example: 'uuid-book-id' })
    @IsUUID()
    @IsNotEmpty()
    bookId!: string;
}
