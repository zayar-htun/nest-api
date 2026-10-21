import { Injectable, NestMiddleware } from '@nestjs/common';

import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      console.log(
        `[RESPONSE] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  }
}
