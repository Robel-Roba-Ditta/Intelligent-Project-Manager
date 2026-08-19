import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../project/domain/project.entity';
import { Epic } from '../../epic/domain/epic.entity';
import { Sprint } from '../../sprint/domain/sprint.entity';
import { User } from '../../user/domain/user.entity';
import { Label } from '../../../modules/label/domain/label.entity';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskType {
  TASK = 'TASK',
  BUG = 'BUG',
  STORY = 'STORY',
}

@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'enum', enum: TaskType, default: TaskType.TASK })
  type: TaskType;

  @Column({ type: 'int', nullable: true, name: 'story_points' })
  storyPoints: number | null;

  @Column({ type: 'timestamp', nullable: true, name: 'due_date' })
  dueDate: Date | null;

  @Column({ default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  // ─── Foreign Keys ──────────────────────────────────────────

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => Epic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'epic_id' })
  epic: Epic | null;

  @Column({ type: 'int', nullable: true, name: 'epic_id' })
  epicId: number | null;

  @ManyToOne(() => Sprint, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint | null;

  @Column({ type: 'int', nullable: true, name: 'sprint_id' })
  sprintId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @Column({ type: 'int', nullable: true, name: 'assignee_id' })
  assigneeId: number | null;

  // ─── Self-referencing subtask relationship ─────────────────

  @ManyToOne(() => Task, (task) => task.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_task_id' })
  parent: Task | null;

  @Column({ type: 'int', nullable: true, name: 'parent_task_id' })
  parentTaskId: number | null;

  @OneToMany(() => Task, (task) => task.parent)
  children: Task[];

  // ─── Creator ───────────────────────────────────────────────

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: number;

  // ─── Labels (many-to-many) ─────────────────────────────────

  @ManyToMany(() => Label, { cascade: true, eager: false })
  @JoinTable({
    name: 'task_labels',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'label_id', referencedColumnName: 'id' },
  })
  labels: Label[];
}
