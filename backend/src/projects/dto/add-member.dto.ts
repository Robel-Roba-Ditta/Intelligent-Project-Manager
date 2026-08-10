import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ProjectRole } from '../entities/project-member.entity';

export class AddMemberDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @IsEnum(ProjectRole, { message: 'Role must be either "admin" or "member"' })
  role?: ProjectRole;
}
