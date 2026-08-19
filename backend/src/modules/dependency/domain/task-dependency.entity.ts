import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Task } from '../../task/domain/task.entity';

@Entity('task_dependencies')
@Unique(['blockingTaskId', 'blockedTaskId'])
export class TaskDependency {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocking_task_id' })
  blockingTask: Task;

  @Column({ name: 'blocking_task_id' })
  blockingTaskId: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_task_id' })
  blockedTask: Task;

  @Column({ name: 'blocked_task_id' })
  blockedTaskId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
