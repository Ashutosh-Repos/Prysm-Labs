import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.error(exception.message);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: 'Conflict: Unique constraint failed. Record already exists.',
          error: exception.meta?.target || 'Duplicate field',
        });
        break;
      }
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: 'Not Found: Record does not exist.',
          error: 'Not Found',
        });
        break;
      }
      default: {
        // default 500
        const defaultStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(defaultStatus).json({
          statusCode: defaultStatus,
          message: message,
        });
        break;
      }
    }
  }
}
