import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { createTasksDto } from './dto/create-tasks.dto.js';
import { updateTasksDto } from './dto/update-tasks.dto.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: createTasksDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    dto: updateTasksDto,
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findOne(id, user);
  }

  @Get()
  findAll(
    @Query() query: TaskQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findAll(query, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.remove(id, user);
  }

}
