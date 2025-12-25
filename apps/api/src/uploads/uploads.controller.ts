import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {

    @Post('cover')
    @ApiOperation({ summary: 'Upload book cover image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @Roles(Role.ADMIN, Role.LIBRARIAN)
    @ApiBearerAuth()
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                    return cb(new BadRequestException('Only image files are allowed!'), false);
                }
                cb(null, true);
            },
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        // Return relative path or full URL. Frontend needs to prefix it or backend serves it.
        // Let's assume we serve /uploads static route.
        return {
            url: `/uploads/covers/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
        };
    }
}
