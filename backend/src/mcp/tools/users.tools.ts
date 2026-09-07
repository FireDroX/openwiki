import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { EmailAlreadyExistsException } from '../../common/exceptions/auth/email-already-exists.exception.js';
import { USER_ROLES } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/services/users.service.js';
import {
  defineMcpTool,
  McpToolDefinition,
} from '../registry/mcp-tools.registry.js';

const USERS_READ_SCOPE = 'users:read';
const USERS_WRITE_SCOPE = 'users:write';
const SALT_ROUNDS = 10;

export function buildUsersTools(
  usersService: UsersService,
): McpToolDefinition[] {
  return [
    defineMcpTool({
      name: 'wiki_create_user',
      description:
        "Créer un compte utilisateur avec un mot de passe temporaire (jamais renvoyé, l'utilisateur devra réinitialiser son mot de passe)",
      inputSchema: {
        email: z.string(),
        displayName: z.string(),
        role: z.enum(USER_ROLES),
      },
      requiredScopes: [USERS_WRITE_SCOPE],
      hideWithoutScope: true,
      handler: async (input) => {
        const existing = await usersService.findByEmail(input.email);
        if (existing) {
          throw new EmailAlreadyExistsException();
        }

        const temporaryPassword = randomBytes(24).toString('hex');
        const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

        const user = await usersService.create({
          email: input.email,
          passwordHash,
          displayName: input.displayName,
          role: input.role,
        });

        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        };
      },
    }),
    defineMcpTool({
      name: 'wiki_list_users',
      description: 'Lister les utilisateurs (paginé)',
      inputSchema: {
        page: z.number().optional(),
        limit: z.number().optional(),
      },
      requiredScopes: [USERS_READ_SCOPE],
      hideWithoutScope: true,
      handler: async (input) => {
        const { items, total } = await usersService.findAllPaginated({
          page: input.page?.toString(),
          limit: input.limit?.toString(),
        });
        return {
          items: items.map((user) => ({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
          })),
          total,
        };
      },
    }),
    defineMcpTool({
      name: 'wiki_update_user_role',
      description: "Modifier le rôle d'un utilisateur",
      inputSchema: { userId: z.string(), role: z.enum(USER_ROLES) },
      requiredScopes: [USERS_WRITE_SCOPE],
      hideWithoutScope: true,
      handler: async (input, ctx) => {
        const user = await usersService.updateRole(ctx.userId, input.userId, {
          role: input.role,
        });
        return { id: user.id, role: user.role };
      },
    }),
  ];
}
