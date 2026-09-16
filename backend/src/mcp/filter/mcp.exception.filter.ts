import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';

const JSON_RPC_AUTH_ERROR_CODE = -32001;

@Catch()
export class McpExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (
      exception instanceof UnauthorizedException ||
      exception instanceof ForbiddenException
    ) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception.name === 'InvalidApiKeyException') {
      response.status(HttpStatus.UNAUTHORIZED).json({
        jsonrpc: '2.0',
        error: { code: JSON_RPC_AUTH_ERROR_CODE, message: exception.message },
        id: null,
      });
      return;
    }

    const { statusCode, error } = McpExceptionFilter.resolve(exception);
    const body: ErrorResponseDto = { error };
    response.status(statusCode).json(body);
  }

  private static resolve(exception: Error): {
    statusCode: number;
    error: string;
  } {
    switch (exception.name) {
      case 'McpApiKeyNotFoundException':
        return { statusCode: HttpStatus.NOT_FOUND, error: exception.message };
      case 'ValidationException':
      case 'OAuthInvalidRequestException':
        return { statusCode: HttpStatus.BAD_REQUEST, error: exception.message };
      case 'OAuthInvalidClientException':
      case 'OAuthRefreshTokenNotFoundException':
        return { statusCode: HttpStatus.NOT_FOUND, error: exception.message };
      case 'OAuthAccessDeniedException':
        return { statusCode: HttpStatus.FORBIDDEN, error: exception.message };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: exception.message || 'Internal server error',
        };
    }
  }
}
