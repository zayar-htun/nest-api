import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { TaskPriorityDto, TaskStatusDto } from "./create-tasks.dto.js";

export class CreateUserTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: TaskStatusDto;

  @IsOptional()
  @IsEnum(TaskPriorityDto)
  priority?: TaskPriorityDto;
}
