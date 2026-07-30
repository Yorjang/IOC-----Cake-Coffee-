import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map(data => {
        // If the data already contains a 'message' and it looks like a wrapped response, 
        // we might not want to wrap it twice, but let's standardize everything.
        // For endpoints that return { message: '...' } directly, we extract it.
        
        let message = 'Thành công';
        let responseData = data;

        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message;
          // If there's more data inside, extract it, otherwise just return the data object minus message
          if (Object.keys(data).length === 1) {
            responseData = null;
          } else if ('data' in data) {
            responseData = data.data;
          } else {
            const { message: _, ...rest } = data;
            responseData = rest;
          }
        }

        return {
          statusCode,
          message,
          data: responseData ?? null,
        };
      }),
    );
  }
}
