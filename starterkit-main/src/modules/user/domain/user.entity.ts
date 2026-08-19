import { CommonEntity } from '@common/common.entity';
import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserRoleEntity } from './user-role.entity';
import { FileDto } from '@common/dto/file-dto';
import { UserAddress } from '@common/dto/user-address';

@Entity('users')
export class UserEntity extends CommonEntity {
  @Column({ type: 'varchar', name: 'first_name' })
  firstName!: string;
  @Column({ type: 'varchar', name: 'middle_name', nullable: true })
  middleName?: string;
  @Column({ type: 'varchar', name: 'last_name', nullable: true })
  lastName?: string;
  @Column({ type: 'varchar', unique: true })
  email!: string;
  @Column({ type: 'varchar' })
  @Exclude()
  password!: string;
  @Column({ type: 'varchar', nullable: true })
  phone?: string;
  @Column({ type: 'varchar', name: 'job_title', nullable: true })
  jobTitle?: string;
  @Column({ type: 'varchar', nullable: true })
  gender?: string;
  @Column({ type: 'jsonb', name: 'profile_picture', nullable: true })
  profilePicture?: FileDto;
  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;
  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth?: Date;
  @Column({ type: 'jsonb', name: 'address', nullable: true })
  address?: UserAddress;
  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user, {
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    cascade: true,
  })
  userRoles!: UserRoleEntity[];
  addUserRole(userRole: UserRoleEntity) {
    this.userRoles.push(userRole);
  }
  updateUserRole(userRole: UserRoleEntity) {
    const existIndex = this.userRoles.findIndex(
      (element) => element.id === userRole.id,
    );
    this.userRoles[existIndex] = userRole;
  }
  removeUserRole(id: string) {
    this.userRoles = this.userRoles.filter((element) => element.id !== id);
  }
  updateUserRoles(userRoles: UserRoleEntity[]) {
    this.userRoles = userRoles;
  }
}
