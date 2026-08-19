import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../project/domain/project.entity';
import { Task } from '../task/domain/task.entity';
import { SearchService } from './application/search.service';
import { SearchController } from './api/controllers/search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
