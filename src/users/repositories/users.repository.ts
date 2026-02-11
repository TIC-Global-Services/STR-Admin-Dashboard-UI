import { Injectable } from '@nestjs/common';

// Mock user data
const mockUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  password: '$2b$10$YourHashedPasswordHere', // This is a bcrypt hash
  isActive: true,
  roles: [
    {
      role: {
        name: 'SUPER_ADMIN',
        permissions: [
          { permission: { key: 'users:read' } },
          { permission: { key: 'users:write' } },
          { permission: { key: 'memberships:read' } },
          { permission: { key: 'memberships:write' } },
        ],
      },
    },
  ],
};

@Injectable()
export class UsersRepository {
  async findByEmailForAuth(email: string) {
    // Return mock user for any email
    return mockUser;
  }

  async findByIdForAuth(id: string) {
    // Return mock user for any id
    return mockUser;
  }

  async findByIdForView(id: string) {
    return {
      id: mockUser.id,
      email: mockUser.email,
      isActive: mockUser.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: mockUser.roles,
    };
  }

  async createUser(data: { email: string; password: string }) {
    return { id: 'new-user-id' };
  }

  async updateUser(
    id: string,
    data: Partial<{ password: string; isActive: boolean }>,
  ) {
    return { id };
  }

  async deleteUserRoles(userId: string) {
    return { count: 0 };
  }

  async assignRoles(userId: string, roleIds: string[]) {
    return { count: roleIds.length };
  }

  async findManyForList(skip = 0, take = 20) {
    return [mockUser];
  }
}
