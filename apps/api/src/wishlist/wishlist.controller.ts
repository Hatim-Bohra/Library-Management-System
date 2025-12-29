import { Controller, Get, Post, Delete, Param, UseGuards, Request, Req } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AtGuard } from '../auth/guards/at.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Wishlist')
@ApiBearerAuth()
@Controller('wishlist')
@UseGuards(AtGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    getMyWishlist(@Req() req: any) {
        return this.wishlistService.getWishlist(req.user.sub); // AtGuard usually puts user in req.user.sub or req.user.userId. I should check AtGuard/Strategy.
    }

    @Get(':bookId/status')
    checkStatus(@Req() req: any, @Param('bookId') bookId: string) {
        return this.wishlistService.checkStatus(req.user.sub, bookId);
    }

    @Post(':bookId')
    addToWishlist(@Req() req: any, @Param('bookId') bookId: string) {
        return this.wishlistService.addToWishlist(req.user.sub, bookId);
    }

    @Delete(':bookId')
    removeFromWishlist(@Req() req: any, @Param('bookId') bookId: string) {
        return this.wishlistService.removeFromWishlist(req.user.sub, bookId);
    }
}
