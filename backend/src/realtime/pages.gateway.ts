import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ACCESS_TOKEN_COOKIE } from '../common/variables.global.js';
import type { AuthenticatedUser } from '../common/strategies/jwt.strategy.js';
import { PAGE_TREE_CHANGED_EVENT } from '../pages/events/page-tree-changed.event.js';
import {
  PAGE_VERSION_CREATED_EVENT,
  PageVersionCreatedEvent,
} from '../pages/events/page-version-created.event.js';
import { PagesService } from '../pages/services/pages.service.js';

interface JwtAccessPayload {
  sub: string;
  email: string;
  role: AuthenticatedUser['role'];
}

interface AuthenticatedSocketData {
  user?: AuthenticatedUser;
}

type AuthenticatedSocket = Socket<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  AuthenticatedSocketData
>;

@Injectable()
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class PagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly pagesService: PagesService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = PagesGateway.extractAccessToken(
      client.handshake.headers.cookie,
    );
    if (!token) {
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(
        token,
        { secret: this.configService.get<string>('JWT_ACCESS_SECRET') },
      );
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      } satisfies AuthenticatedUser;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('page:join')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { pageId: string },
  ): Promise<{ error?: string }> {
    try {
      await this.pagesService.getByIdOrFail(body.pageId, client.data.user);
    } catch {
      return { error: 'forbidden' };
    }
    await client.join(`page:${body.pageId}`);
    return {};
  }

  @SubscribeMessage('page:leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { pageId: string },
  ): void {
    void client.leave(`page:${body.pageId}`);
  }

  @OnEvent(PAGE_VERSION_CREATED_EVENT)
  handlePageVersionCreated(event: PageVersionCreatedEvent): void {
    this.server.to(`page:${event.pageId}`).emit('page:version-created', event);
  }

  @OnEvent(PAGE_TREE_CHANGED_EVENT)
  handlePageTreeChanged(): void {
    this.server.emit('page-tree:changed');
  }

  private static extractAccessToken(cookieHeader?: string): string | null {
    if (!cookieHeader) {
      return null;
    }
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
    return match
      ? decodeURIComponent(match.slice(ACCESS_TOKEN_COOKIE.length + 1))
      : null;
  }
}
