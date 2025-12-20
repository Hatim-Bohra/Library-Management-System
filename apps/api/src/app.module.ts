import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { MembersModule } from './members/members.module';
import { CirculationModule } from './circulation/circulation.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [DatabaseModule, AuthModule, BooksModule, MembersModule, CirculationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
