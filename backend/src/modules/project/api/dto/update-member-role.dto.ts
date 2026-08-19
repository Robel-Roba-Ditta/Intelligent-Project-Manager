import { IsEnum } from 'class-validator';
import { ProjectRole } from '../../domain/project-member.entity';

export class UpdateMemberRoleDto {
  @IsEnum(ProjectRole, { message: 'Role must be either "admin" or "member"' })
  role: ProjectRole;
}
