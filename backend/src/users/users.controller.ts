import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import { ResponseDto } from '../common/dto/response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../common/strategies/jwt.strategy.js';
import { ListUsersQueryDto } from './dto/in/list-users-query.dto.js';
import { UpdateProfileDto } from './dto/in/update-profile.dto.js';
import { UpdateRoleDto } from './dto/in/update-role.dto.js';
import { UserResponseDto } from './dto/out/user-response.dto.js';
import { UsersExceptionFilter } from './filter/users-exception.filter.js';
import { UserMapper } from './mapper/user.mapper.js';
import { UsersService } from './services/users.service.js';

@ApiTags('Users')
@Controller('users')
@UseFilters(UsersExceptionFilter)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer mon profil' })
  @ApiOkResponse({ description: "Profil de l'utilisateur connecté." })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResponseDto<UserResponseDto>> {
    const entity = await this.usersService.findById(user.id);
    return UserMapper.toResponse(entity);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier mon profil' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ description: 'Profil mis à jour.' })
  @ApiBadRequestResponse({
    description: "Nom d'affichage invalide.",
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ResponseDto<UserResponseDto>> {
    const entity = await this.usersService.updateProfile(user.id, dto);
    return UserMapper.toResponse(entity);
  }
}

@ApiTags('Admin — Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@UseFilters(UsersExceptionFilter)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs' })
  @ApiOkResponse({ description: 'Liste paginée des utilisateurs.' })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rôle admin requis.',
    type: ErrorResponseDto,
  })
  async listUsers(
    @Query() query: ListUsersQueryDto,
  ): Promise<ResponseDto<PaginatedResponseDto<UserResponseDto>>> {
    const { items, total, page, limit } =
      await this.usersService.findAllPaginated(query);
    return UserMapper.toPaginatedResponse(items, total, page, limit);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: "Modifier le rôle d'un utilisateur" })
  @ApiParam({ name: 'id', description: "Identifiant de l'utilisateur" })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOkResponse({ description: 'Rôle mis à jour.' })
  @ApiBadRequestResponse({
    description: 'Rôle invalide.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rôle admin requis.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: "L'utilisateur n'existe pas.",
    type: ErrorResponseDto,
  })
  async updateRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<ResponseDto<UserResponseDto>> {
    const entity = await this.usersService.updateRole(admin.id, id, dto);
    return UserMapper.toResponse(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', description: "Identifiant de l'utilisateur" })
  @ApiNoContentResponse({ description: 'Utilisateur supprimé.' })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rôle admin requis.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: "L'utilisateur n'existe pas.",
    type: ErrorResponseDto,
  })
  async deleteUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.usersService.deleteUser(admin.id, id);
  }
}
