import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { QueryFailedError } from 'typeorm';
import { EmailAlreadyExistsException } from '../../common/exceptions/auth/email-already-exists.exception.js';
import { InvalidCredentialsException } from '../../common/exceptions/auth/invalid-credentials.exception.js';
import { InvalidRefreshTokenException } from '../../common/exceptions/auth/invalid-refresh-token.exception.js';
import { InvalidTurnstileTokenException } from '../../common/exceptions/auth/invalid-turnstile-token.exception.js';
import { ValidationException } from '../../common/exceptions/validation.exception.js';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
} from '../../common/variables.global.js';
import { TurnstileService } from '../../security/services/turnstile.service.js';
import { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/services/users.service.js';
import { LoginDto } from '../dto/in/login.dto.js';
import { RegisterDto } from '../dto/in/register.dto.js';

const SALT_ROUNDS = 10;
const MYSQL_DUPLICATE_ENTRY_CODE = 'ER_DUP_ENTRY';
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

interface JwtPayload {
  sub: string;
  email: string;
  role: User['role'];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly turnstileService: TurnstileService,
  ) {}

  async register(dto: RegisterDto, remoteIp?: string): Promise<User> {
    if (!(await this.turnstileService.verify(dto.turnstileToken, remoteIp))) {
      throw new InvalidTurnstileTokenException();
    }

    this.validate(dto);

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new EmailAlreadyExistsException();
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      return await this.usersService.create({
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        role: 'reader',
      });
    } catch (error) {
      if (AuthService.isDuplicateEmailError(error)) {
        throw new EmailAlreadyExistsException();
      }
      throw error;
    }
  }

  async login(dto: LoginDto, remoteIp?: string): Promise<TokenPair> {
    if (!(await this.turnstileService.verify(dto.turnstileToken, remoteIp))) {
      throw new InvalidTurnstileTokenException();
    }

    this.validateLogin(dto);

    const user = await this.validateUser(dto.email, dto.password);
    return this.generateTokens(user);
  }

  refresh(refreshToken: string | undefined): { accessToken: string } {
    if (!refreshToken) {
      throw new InvalidRefreshTokenException();
    }

    const payload = this.verifyRefreshToken(refreshToken);
    const accessToken = this.generateAccessToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return { accessToken };
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new InvalidCredentialsException();
    }
    return user;
  }

  private generateTokens(user: User): TokenPair {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });

    return { accessToken, refreshToken };
  }

  private generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    });
  }

  private verifyRefreshToken(refreshToken: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new InvalidRefreshTokenException();
    }
  }

  private validateLogin(dto: LoginDto): void {
    const errors: string[] = [];

    if (!dto.email || !EMAIL_REGEX.test(dto.email)) {
      errors.push('email must be a valid email');
    }
    if (!dto.password) {
      errors.push('password should not be empty');
    }

    if (errors.length > 0) {
      throw new ValidationException(errors.join(', '));
    }
  }

  private validate(dto: RegisterDto): void {
    const errors: string[] = [];

    if (!dto.email || !EMAIL_REGEX.test(dto.email)) {
      errors.push('email must be a valid email');
    }
    if (!dto.password || dto.password.length < MIN_PASSWORD_LENGTH) {
      errors.push(
        `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }
    if (
      !dto.displayName ||
      dto.displayName.length < DISPLAY_NAME_MIN_LENGTH ||
      dto.displayName.length > DISPLAY_NAME_MAX_LENGTH
    ) {
      errors.push(
        `displayName must be between ${DISPLAY_NAME_MIN_LENGTH} and ${DISPLAY_NAME_MAX_LENGTH} characters`,
      );
    }

    if (errors.length > 0) {
      throw new ValidationException(errors.join(', '));
    }
  }

  private static isDuplicateEmailError(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as { driverError?: { code?: string } }).driverError?.code ===
        MYSQL_DUPLICATE_ENTRY_CODE
    );
  }
}
