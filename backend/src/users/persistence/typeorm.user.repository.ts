import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/in/create-user.dto.js';
import { UpdateProfileDto } from '../dto/in/update-profile.dto.js';
import { User, UserRole } from '../entities/user.entity.js';
import { UserRepository } from './user.repository.js';

@Injectable()
export class TypeormUserRepository implements UserRepository {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  async create(data: CreateUserDto): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async update(id: string, data: UpdateProfileDto): Promise<User> {
    const patch: Partial<User> = {};
    if (data.displayName !== undefined) {
      patch.displayName = data.displayName;
    }
    if (data.avatarUrl !== undefined) {
      patch.avatarUrl = data.avatarUrl;
    }

    await this.repository.update(id, patch);
    return (await this.findById(id)) as User;
  }

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{ items: User[]; total: number }> {
    const [items, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'ASC' },
    });
    return { items, total };
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    await this.repository.update(id, { role });
    return (await this.findById(id)) as User;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async incrementFailedLoginAttempts(id: string): Promise<User> {
    await this.repository.increment({ id }, 'failedLoginAttempts', 1);
    return (await this.findById(id)) as User;
  }

  async lockAccount(id: string, lockedUntil: Date): Promise<User> {
    await this.repository.update(id, { lockedUntil });
    return (await this.findById(id)) as User;
  }

  async resetFailedLoginAttempts(id: string): Promise<User> {
    await this.repository.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    return (await this.findById(id)) as User;
  }
}
