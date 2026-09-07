import { CreateUserDto } from '../dto/in/create-user.dto.js';
import { UpdateProfileDto } from '../dto/in/update-profile.dto.js';
import { User, UserRole } from '../entities/user.entity.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateProfileDto): Promise<User>;
  findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{ items: User[]; total: number }>;
  updateRole(id: string, role: UserRole): Promise<User>;
  delete(id: string): Promise<void>;
  incrementFailedLoginAttempts(id: string): Promise<User>;
  lockAccount(id: string, lockedUntil: Date): Promise<User>;
  resetFailedLoginAttempts(id: string): Promise<User>;
}
