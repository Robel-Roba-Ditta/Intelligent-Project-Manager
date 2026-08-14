import { IsInt } from 'class-validator';

export class CreateDependencyDto {
  @IsInt()
  blockedTaskId: number;
}
