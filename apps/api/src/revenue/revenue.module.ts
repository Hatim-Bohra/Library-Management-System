import { Module } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
    controllers: [RevenueController, WalletController],
    providers: [RevenueService, WalletService],
    exports: [WalletService]
})
export class RevenueModule { }
