import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,
  ) {}

  async findAllByTask(taskId: number): Promise<ActivityLog[]> {
    return this.activityRepo.find({
      where: { taskId },
      relations: { actor: true },
      order: { createdAt: 'ASC' },
    });
  }
}
