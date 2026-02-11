import { UserResponseDto } from "./dto/user.response";

export function toUserResponse(user: any): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    roles: user.roles.map((r) => r.role.name),
    createdAt: user.createdAt,
  };
}
