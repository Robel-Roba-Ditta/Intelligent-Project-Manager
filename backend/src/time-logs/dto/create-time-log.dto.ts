import { IsNumber, Min, IsDateString } from 'class-validator';

export class CreateTimeLogDto {
  @IsNumber()
  @Min(0.01)
  hours: number;

  @IsDateString()
  date: string;
}
