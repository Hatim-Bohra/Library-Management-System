import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    // TODO: Implement validateUser, login, register
}
