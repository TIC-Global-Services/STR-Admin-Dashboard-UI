import { IsArray } from 'class-validator';

export class AssignRoleDto {
  @IsArray()
  roleIds: string[]; // ['ADMIN', 'PR']
}
