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
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserTaskDto } from '../tasks/dto/create-user-task.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { TasksService } from '../tasks/tasks.service.js';
import { TaskQueryDto } from '../tasks/dto/task-query.dto.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Get(':id/tasks')
  findUserTasks(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: TaskQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.tasksService.findUserTasks(id, query, currentUser);
  }

  @Post(':id/tasks')
  createUserTask(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: CreateUserTaskDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.tasksService.createUserTasks(userId, dto, currentUser);
  }
}
