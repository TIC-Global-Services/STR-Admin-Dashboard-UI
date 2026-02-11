import {
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class ApplyMembershipDto {
  @IsString()
  fullName: string;

  @IsDateString()
  dob: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsString()
  occupation: string;

  @IsString()
  aadharNumber: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  zone: string;

  @IsString()
  district: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  instagramId?: string;

  @IsOptional()
  @IsString()
  xTwitterId?: string;
}
