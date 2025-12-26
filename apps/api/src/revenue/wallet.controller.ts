import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { IsNumber, IsPositive } from 'class-validator';

class AddFundsDto {
    @IsNumber()
    @IsPositive()
    amount!: number;
}

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @ApiOperation({ summary: 'Get wallet balance' })
    @Get('balance')
    getBalance(@GetCurrentUser() user: any) {
        return this.walletService.getBalance(user.sub);
    }

    @ApiOperation({ summary: 'Add funds to wallet' })
    @Post('deposit')
    addFunds(@Body() dto: AddFundsDto, @GetCurrentUser() user: any) {
        return this.walletService.addFunds(user.sub, dto.amount);
    }

    @ApiOperation({ summary: 'Get transaction history' })
    @Get('transactions')
    getTransactions(@GetCurrentUser() user: any) {
        return this.walletService.getTransactions(user.sub);
    }
}
