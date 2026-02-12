import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface UserRole {
  role?: {
    id?: string;
    name: string;
    description?: string;
  };
  // Alternative flat structure support
  id?: string;
  name?: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  password?: string;
  isActive?: boolean;
}

export const usersApi = {
  // Get all users
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get("/users");
    return data;
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  // Create new user
  create: async (payload: CreateUserDto): Promise<User> => {
    const { data } = await apiClient.post("/users", payload);
    return data;
  },

  // Update user
  update: async (id: string, payload: UpdateUserDto): Promise<User> => {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return data;
  },

  // Assign roles to user
  assignRoles: async (id: string, roleIds: string[]): Promise<User> => {
    const { data } = await apiClient.put(`/users/${id}/roles`, {
      roleIds,
    });
    return data;
  },
};