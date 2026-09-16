import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

interface OAuthErrorBody {
  error: string;
  error_description: string;
}

@Catch()
export class OAuthExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, body } = OAuthExceptionFilter.resolve(exception);
    response.status(statusCode).json(body);
  }

  private static resolve(exception: Error): {
    statusCode: number;
    body: OAuthErrorBody;
  } {
    switch (exception.name) {
      case 'OAuthInvalidRequestException':
      case 'ValidationException':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          body: {
            error: 'invalid_request',
            error_description: exception.message,
          },
        };
      case 'OAuthInvalidClientException':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          body: {
            error: 'invalid_client',
            error_description: exception.message,
          },
        };
      case 'OAuthInvalidGrantException':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          body: {
            error: 'invalid_grant',
            error_description: exception.message,
          },
        };
      case 'OAuthAccessDeniedException':
        return {
          statusCode: HttpStatus.FORBIDDEN,
          body: {
            error: 'access_denied',
            error_description: exception.message,
          },
        };
      case 'OAuthUnsupportedGrantTypeException':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          body: {
            error: 'unsupported_grant_type',
            error_description: exception.message,
          },
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            error: 'server_error',
            error_description: exception.message || 'Internal server error',
          },
        };
    }
  }
}
