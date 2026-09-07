import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { ResponseDto } from '../common/dto/response.dto.js';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../common/variables.global.js';
import { LoginDto } from './dto/in/login.dto.js';
import { RegisterDto } from './dto/in/register.dto.js';
import { UserResponseDto } from './dto/out/user-response.dto.js';
import { AuthExceptionFilter } from './filter/auth-exception.filter.js';
import { UserMapper } from './mapper/user.mapper.js';
import { AuthService, type TokenPair } from './services/auth.service.js';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_THROTTLE_LIMIT = 5;
const AUTH_THROTTLE_TTL_MS = 60000;

@ApiTags('Auth')
@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS },
  })
  @ApiOperation({ summary: 'Créer un compte utilisateur' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'Compte créé avec succès.' })
  @ApiBadRequestResponse({
    description: "Email, mot de passe ou nom d'affichage invalide.",
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Cet email est déjà utilisé.',
    type: ErrorResponseDto,
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<ResponseDto<UserResponseDto>> {
    const user = await this.authService.register(
      dto,
      AuthController.resolveClientIp(req),
    );
    return UserMapper.toRegisterResponse(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS },
  })
  @ApiOperation({ summary: 'Se connecter' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Connexion réussie, tokens déposés en cookies httpOnly.',
  })
  @ApiUnauthorizedResponse({
    description: 'Email ou mot de passe incorrect.',
    type: ErrorResponseDto,
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto<null>> {
    const tokens = await this.authService.login(
      dto,
      AuthController.resolveClientIp(req),
    );
    this.setAuthCookies(res, tokens);
    return new ResponseDto(null);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS },
  })
  @ApiOperation({ summary: "Rafraîchir le token d'accès" })
  @ApiOkResponse({
    description: "Nouveau token d'accès déposé en cookie.",
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token manquant ou invalide.',
    type: ErrorResponseDto,
  })
  refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): ResponseDto<null> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      string | undefined;
    const { accessToken } = this.authService.refresh(refreshToken);
    this.setCookie(
      res,
      ACCESS_TOKEN_COOKIE,
      accessToken,
      ACCESS_TOKEN_MAX_AGE_MS,
    );
    return new ResponseDto(null);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se déconnecter' })
  @ApiOkResponse({
    description: "Cookies d'authentification supprimés.",
  })
  logout(@Res({ passthrough: true }) res: Response): ResponseDto<null> {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
    return new ResponseDto(null);
  }

  private setAuthCookies(res: Response, tokens: TokenPair): void {
    this.setCookie(
      res,
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      ACCESS_TOKEN_MAX_AGE_MS,
    );
    this.setCookie(
      res,
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      REFRESH_TOKEN_MAX_AGE_MS,
    );
  }

  private setCookie(
    res: Response,
    name: string,
    value: string,
    maxAge: number,
  ): void {
    res.cookie(name, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge,
    });
  }

  private static resolveClientIp(req: Request): string | undefined {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0].trim();
    }
    return req.ip;
  }
}
