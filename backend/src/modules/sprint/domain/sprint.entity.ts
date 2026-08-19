import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../project/domain/project.entity';

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

@Entity('sprints')
export class Sprint extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  goal: string | null;

  @Column({ type: 'enum', enum: SprintStatus, default: SprintStatus.PLANNED })
  status: SprintStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'start_date' })
  startDate: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'end_date' })
  endDate: Date | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: number;
}
