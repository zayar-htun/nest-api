import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();

    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal Server Error';

    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const data = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message = data.message ?? exception.message;

        error = data.error ?? exception.name;
      }
    }

    console.error({
      method: request.method,
      path: request.url,
      status,
      exception,
    });

    response.status(status).json({
      success: false,

      statusCode: status,

      message,

      error,

      path: request.url,

      method: request.method,

      timestamp: new Date().toISOString(),
    });
  }
}
