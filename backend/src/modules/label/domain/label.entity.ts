import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../project/domain/project.entity';

@Entity('labels')
export class Label extends BaseEntity {
  @Column()
  name: string;

  @Column({ length: 7 })
  color: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: number;
}
