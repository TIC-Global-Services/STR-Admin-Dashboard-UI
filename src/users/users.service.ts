import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// External API configuration
const EXTERNAL_API_URL = 'https://str-admin.vercel.app/api/v1';
const EXTERNAL_API_CREDENTIALS = {
  email: 'manojkumararumainathan@gmail.com',
  password: '12345678',
};

@Injectable()
export class UsersService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly usersRepo: UsersRepository) {}

  // Get access token from external API
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${EXTERNAL_API_URL}/auth/login`,
        EXTERNAL_API_CREDENTIALS,
      );
      this.accessToken = response.data.accessToken;
      // Token expires in 15 minutes, refresh 1 minute before
      this.tokenExpiry = Date.now() + 14 * 60 * 1000;
      return this.accessToken!;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error('Failed to authenticate with external API');
    }
  }

  // CREATE USER
  async createUser(dto: CreateUserDto) {
    const existing = await this.usersRepo.findByEmailForAuth(dto.email);
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepo.createUser({
      email: dto.email,
      password: hashedPassword,
    });

    if (dto.roleIds?.length) {
      await this.usersRepo.assignRoles(user.id, dto.roleIds);
    }

    return this.getUserById(user.id);
  }

  // UPDATE USER
  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findByIdForView(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    await this.usersRepo.updateUser(userId, updateData);

    return this.getUserById(userId);
  }

  // ASSIGN ROLES
  async assignRoles(userId: string, roleIds: string[]) {
    const user = await this.usersRepo.findByIdForView(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepo.deleteUserRoles(userId);
    await this.usersRepo.assignRoles(userId, roleIds);

    return this.getUserById(userId);
  }

  
  // READ (public service methods)
  getUserForAuth(email: string) {
    return this.usersRepo.findByEmailForAuth(email);
  }
  getUserByIdForAuth(email: string) {
    return this.usersRepo.findByIdForAuth(email);
  }

  async getUserById(id: string) {
    // First get from local database
    const localUser = await this.usersRepo.findByIdForView(id);
    
    if (!localUser) {
      throw new NotFoundException('User not found');
    }

    // Try to enrich with external API data
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${EXTERNAL_API_URL}/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      
      // Merge external data with local data
      return {
        ...localUser,
        ...response.data,
      };
    } catch (error) {
      console.error(`Failed to fetch user ${id} from external API:`, error);
      // Return local data if external API fails
      return localUser;
    }
  }
}
