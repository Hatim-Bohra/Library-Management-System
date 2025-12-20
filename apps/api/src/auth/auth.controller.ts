import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login() {
        // TODO
        return 'login';
    }

    @Post('register')
    async register() {
        // TODO
        return 'register';
    }
}
