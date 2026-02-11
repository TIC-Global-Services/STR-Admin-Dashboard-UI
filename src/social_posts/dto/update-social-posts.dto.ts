import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSocialPostDto {
  @IsOptional()
  @IsString()
  postUrl: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
