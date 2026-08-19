import { CommonEntity } from '@common//common.entity';
import { Column, Entity } from 'typeorm';

@Entity('posts')
export class PostEntity extends CommonEntity {
  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;
}
