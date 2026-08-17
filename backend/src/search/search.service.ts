import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
  ) {}

  async search(q: string) {
    if (!q || q.trim().length === 0) {
      return { projects: [], tasks: [] };
    }

    const trimmed = q.trim();

    const projects = await this.projectsRepo
      .createQueryBuilder('p')
      .select(['p.id', 'p.name'])
      .where('p.name ILIKE :q', { q: `${trimmed}%` })
      .orderBy('p.name', 'ASC')
      .take(5)
      .getMany();

    const tasks = await this.tasksRepo
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.project', 'project')
      .where('t.title ILIKE :q', { q: `${trimmed}%` })
      .andWhere('t.isDeleted = false')
      .orderBy('t.title', 'ASC')
      .take(5)
      .getMany();

    return {
      projects: projects.map((p) => ({ id: p.id, name: p.name })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        projectName: t.project?.name || '',
        status: t.status,
      })),
    };
  }
}
