import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (
      // Check for Prisma Error Code P2002 via duck typing or loose check
      // to avoid instanceof issues in some monorepo/dockered setups
      (exception as any).code === 'P2002'
    ) {
      status = HttpStatus.CONFLICT;
      message = 'Unique constraint violation (e.g., email already exists)';
    }

    // Normalize message if it's an object (e.g. standard validation error)
    const errorResponse =
      typeof message === 'object' && message !== null ? message : { message };

    response.status(status).json({
      statusCode: status,
      ...(errorResponse as any),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
