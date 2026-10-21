import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TaskPriorityDto, TaskStatusDto } from './create-tasks.dto.js';
import { PaginationQuery } from '../../common/dto/pagination-query.dto.js';

export class TaskQueryDto extends PaginationQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: string;

  @IsOptional()
  @IsEnum(TaskPriorityDto)
  priority?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsIn(['id', 'title', 'status', 'priority', 'createdAt', 'updatedAt'])
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
