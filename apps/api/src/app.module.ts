import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { MembersModule } from './members/members.module';
import { CirculationModule } from './circulation/circulation.module';
import { InventoryModule } from './inventory/inventory.module';
import { RequestsModule } from './requests/requests.module';
import { FinesModule } from './fines/fines.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AuthModule, BooksModule, MembersModule, CirculationModule, InventoryModule, RequestsModule, FinesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
