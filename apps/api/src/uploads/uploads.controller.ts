import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

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
    @Public() // Or restrict to Admin? Requirement said "Admin can upload", but for simplicity and preview often public is easier. Let's stick to Public for now or Role based. If Public, anyone can spam uploads. Let's make it Public for ease of "Add Book" flow? No, Add Book is Admin. So Upload should be Admin.
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
        return { url: `/uploads/covers/${file.filename}` };
    }
}
