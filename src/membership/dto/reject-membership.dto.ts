import { IsString } from 'class-validator';

export class RejectMembershipDto {
  @IsString()
  reason: string;
}
