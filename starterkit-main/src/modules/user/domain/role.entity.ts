import { CommonEntity } from '@common/common.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserRoleEntity } from './user-role.entity';

@Entity('roles')
export class RoleEntity extends CommonEntity {
  @Column({ unique: true })
  name!: string;
  @Column({ unique: true })
  key!: string;
  @Column({ type: 'text', nullable: true })
  description?: string;
  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;
  @OneToMany(() => UserRoleEntity, (userRole) => userRole.role, {
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  userRoles?: UserRoleEntity[];
}
