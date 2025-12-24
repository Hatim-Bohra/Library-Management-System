import { IsEnum, IsNotEmpty } from 'class-validator';
import { CreateUserDto } from '../../auth/dto';
import { Role } from '@repo/database';

export class CreateMemberDto extends CreateUserDto {
    @IsNotEmpty()
    @IsEnum(Role)
    role!: Role;
}
