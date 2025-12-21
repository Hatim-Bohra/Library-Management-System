import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { MembersModule } from './members/members.module';
import { CirculationModule } from './circulation/circulation.module';
import { InventoryModule } from './inventory/inventory.module';
import { RequestsModule } from './requests/requests.module';
import { FinesModule } from './fines/fines.module';
import { AuditModule } from './audit/audit.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute
      },
    ]),
    CacheModule.register({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    BooksModule,
    MembersModule,
    CirculationModule,
    InventoryModule,
    RequestsModule,
    FinesModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
