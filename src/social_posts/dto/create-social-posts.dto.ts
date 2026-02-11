import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSocialPostDto {
  @IsString()
  postUrl: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsBoolean()
  isActive: boolean;
}
