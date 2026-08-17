import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
