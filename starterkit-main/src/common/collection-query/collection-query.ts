import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { FilterOperators } from './filter-operators';
export class Filter {
  @ApiProperty()
  @IsString()
  field!: string;
  @ApiProperty()
  // @IsString()
  value?: any;
  @ApiProperty()
  @IsEnum(FilterOperators, {
    message: `Operator must be one of ${Object.keys(
      FilterOperators,
    ).toString()}`,
  })
  operator?: string;
}
export class CollectionQuery {
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  top?: number = 10;
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  skip?: number = 0;

  @ApiProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  orderBy?: Order[];
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  @IsArray()
  @ApiPropertyOptional()
  searchFrom?: string[];

  @ApiProperty()
  @Transform(({ value }) => {
    if (!value) return [];

    // value is an array of arrays of strings now
    return value.map((group: any[]) => {
      return group.map((item: any) => {
        if (Array.isArray(item)) {
          // convert ['price', '>=', '10'] => { field, operator, value }
          const [field, operator, val] = item;
          return {
            field,
            operator,
            value: isNaN(val) ? val : Number(val),
          };
        }
        return item; // if it’s already an object
      });
    });
  })
  @IsOptional()
  @ApiPropertyOptional()
  filter?: Filter[][];

  @ApiProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  includes?: string[];

  @ApiProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  select?: string[];
  @ApiProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  @ApiPropertyOptional()
  @IsOptional()
  groupBy?: string[];
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  count?: boolean;
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  withArchived?: boolean = false;
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  distinct?: boolean;
  @ApiProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  @ApiPropertyOptional()
  @IsOptional()
  distinctOn?: string[];
  @IsOptional()
  @ApiPropertyOptional()
  cache?: boolean | number; //milliseconds
  // @ApiProperty({ description: 'Computed current page number' })
  get pageNumber(): number {
    return Math.floor((this.skip ?? 0) / (this.top ?? 10)) + 1;
  }

  // @ApiProperty({ description: 'Computed page size' })
  get pageSize(): number {
    return this.top ?? 10;
  }
}
enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
}
export class Order {
  @ApiProperty()
  @IsString()
  field?: string;
  @ApiProperty()
  @IsEnum(Direction, {
    message: 'Direction must be either "ASC" or "DESC"',
  })
  direction?: string;

  @ApiProperty()
  @IsEnum(Direction, {
    message: 'nulls must be either "NULLS FIRST" or "NULLS LAST',
  })
  nulls?: string;
}

export class IncludeQuery {
  @ApiProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  includes?: string[];
}
