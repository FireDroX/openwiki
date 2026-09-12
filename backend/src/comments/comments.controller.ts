import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { ResponseDto } from '../common/dto/response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard.js';
import type { AuthenticatedUser } from '../common/strategies/jwt.strategy.js';
import { CreateCommentDto } from './dto/in/create-comment.dto.js';
import { UpdateCommentDto } from './dto/in/update-comment.dto.js';
import { CommentResponseDto } from './dto/out/comment-response.dto.js';
import { CommentsExceptionFilter } from './filter/comments-exception.filter.js';
import { CommentMapper } from './mapper/comment.mapper.js';
import { CommentsService } from './services/comments.service.js';

const COMMENT_CREATE_THROTTLE_LIMIT = 10;
const COMMENT_CREATE_THROTTLE_TTL_MS = 60000;

@ApiTags('Comments')
@Controller('pages/:id/comments')
@UseFilters(CommentsExceptionFilter)
export class PageCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Lister les commentaires d'une page",
    description:
      'Arbre à un niveau (commentaires puis réponses). Authentification optionnelle : droits alignés sur la visibilité de la page.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la page' })
  @ApiOkResponse({ description: 'Commentaires de la page, triés par date.' })
  @ApiForbiddenResponse({
    description: 'Page privée, accès non autorisé.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: "La page n'existe pas.",
    type: ErrorResponseDto,
  })
  async list(
    @Param('id') pageId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<ResponseDto<CommentResponseDto[]>> {
    const { comments, authorNames } =
      await this.commentsService.findAllByPage(pageId, user);
    return CommentMapper.toTreeResponse(comments, authorNames);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: {
      limit: COMMENT_CREATE_THROTTLE_LIMIT,
      ttl: COMMENT_CREATE_THROTTLE_TTL_MS,
    },
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un commentaire, ou une réponse via parentId',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la page' })
  @ApiBody({ type: CreateCommentDto })
  @ApiOkResponse({ description: 'Commentaire créé avec succès.' })
  @ApiBadRequestResponse({
    description:
      'Contenu vide, trop long, ou parentId visant une réponse (1 niveau max).',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: "La page ou le commentaire parent n'existe pas.",
    type: ErrorResponseDto,
  })
  async create(
    @Param('id') pageId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResponseDto<CommentResponseDto>> {
    const { comment, authorNames } = await this.commentsService.createComment(
      pageId,
      dto,
      user,
    );
    return CommentMapper.toResponse(comment, authorNames);
  }
}

@ApiTags('Comments')
@Controller('comments')
@UseFilters(CommentsExceptionFilter)
export class CommentController {
  constructor(private readonly commentsService: CommentsService) {}

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier son propre commentaire' })
  @ApiParam({ name: 'id', description: 'Identifiant du commentaire' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiOkResponse({ description: 'Commentaire modifié.' })
  @ApiBadRequestResponse({
    description: 'Contenu vide ou trop long.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: "Seul l'auteur peut éditer son commentaire.",
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Le commentaire n'existe pas.",
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResponseDto<CommentResponseDto>> {
    const { comment, authorNames } = await this.commentsService.updateComment(
      id,
      dto,
      user,
    );
    return CommentMapper.toResponse(comment, authorNames);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un commentaire',
    description:
      "Auteur : suppression douce (contenu vidé, réponses intactes). Éditeur/admin non-auteur : suppression définitive, cascade sur les réponses.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant du commentaire' })
  @ApiNoContentResponse({ description: 'Commentaire supprimé.' })
  @ApiUnauthorizedResponse({
    description: 'Authentification requise.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Ni auteur, ni éditeur, ni admin.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Le commentaire n'existe pas.",
    type: ErrorResponseDto,
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.commentsService.deleteComment(id, user);
  }
}
