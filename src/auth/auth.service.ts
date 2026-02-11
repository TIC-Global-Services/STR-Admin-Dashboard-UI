import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.getUserForAuth(email);
    if (!user) return null;

    // For mock data, accept any password
    const passwordValid = true; // Skip password check for mock
    if (!passwordValid) return null;

    return user;
  }

  async login(user: any, req: any) {
    console.log(user);
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role.name),
      permissions: user.roles.flatMap((r) =>
        r.role.permissions.map((p) => p.permission.key),
      ),
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    );

    // Mock session storage (no database)
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string, req: any) {
    try {
      const decoded = this.jwtService.verify(refreshToken);

      const user = await this.usersService.getUserByIdForAuth(decoded.sub);
      if (!user) throw new UnauthorizedException();

      return this.login(user, req);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    // Mock logout (no database)
    return { success: true };
  }

  async logoutAll(userId: string) {
    // Mock logout all (no database)
    return { success: true };
  }
}
