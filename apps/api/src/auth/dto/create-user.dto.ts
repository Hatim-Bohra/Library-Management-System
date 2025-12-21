import { IsString, IsNotEmpty } from 'class-validator';
import { AuthDto } from './auth.dto';

export class CreateUserDto extends AuthDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;
}
