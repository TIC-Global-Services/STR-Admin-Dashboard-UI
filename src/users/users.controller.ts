import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { toUserResponse } from './users.mapper';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // -------------------------
  // CREATE USER
  // -------------------------
  @Post()
  @Permissions('USER_CREATE')
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  // -------------------------
  // GET USER BY ID
  // -------------------------
  @Get(':id')
  @Permissions('USER_VIEW')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.getUserById(id);
    return toUserResponse(user);
  }

  // -------------------------
  // UPDATE USER
  // -------------------------
  @Put(':id')
  @Permissions('USER_UPDATE')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  // -------------------------
  // ASSIGN / REPLACE ROLES
  // -------------------------
  @Put(':id/roles')
  @Permissions('ROLE_ASSIGN')
  assignRoles(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.usersService.assignRoles(id, dto.roleIds);
  }
}
