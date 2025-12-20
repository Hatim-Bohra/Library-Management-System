import { IsString, IsNotEmpty, IsInt, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
    @ApiProperty({ example: 'The Great Gatsby' })
    @IsString()
    @IsNotEmpty()
    title!: string;

    @ApiProperty({ example: '978-0743273565' })
    @IsString()
    @IsNotEmpty()
    isbn!: string;

    @ApiProperty({ example: 1925 })
    @IsInt()
    @Min(1000)
    publishedYear!: number;

    @ApiProperty({ example: 5 })
    @IsInt()
    @Min(1)
    copies!: number;

    @ApiProperty({ example: 'uuid-author-id' })
    @IsUUID()
    authorId!: string;

    @ApiProperty({ example: 'uuid-category-id' })
    @IsUUID()
    categoryId!: string;
}
