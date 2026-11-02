import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createTasksDto } from './dto/create-tasks.dto.js';
import { updateTasksDto } from './dto/update-tasks.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { Role } from '../generated/prisma/enums.js';
import { CreateUserTaskDto } from './dto/create-user-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  }

  private ensureTaskAccess(
    taskOwnerId: number,
    currentUser: AuthenticatedUser,
  ) {
    if (currentUser.role !== Role.ADMIN && taskOwnerId !== currentUser.id) {
      throw new ForbiddenException('You cannot access another user task');
    }
  }

  private readonly taskInclude = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };

  async create(dto: createTasksDto, currentUser: AuthenticatedUser) {
    const targetUserId =
      currentUser.role === Role.ADMIN ? dto.userId : currentUser.id;

    if (currentUser.role === Role.ADMIN) {
      await this.ensureUserExists(targetUserId);
    } else if (dto.userId !== currentUser.id) {
      throw new ForbiddenException(' You can create tasks only for yourself');
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        userId: targetUserId,
      },
      include: this.taskInclude,
    });
  }

  async findOne(id: number, currentUser: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: this.taskInclude,
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    this.ensureTaskAccess(task.userId, currentUser);

    return task;
  }

  async update(
    id: number,
    dto: updateTasksDto,
    currentUser: AuthenticatedUser,
  ) {
    const task = await this.findOne(id, currentUser);

    if (dto.userId !== undefined) {
      if (currentUser.role !== Role.ADMIN && dto.userId !== currentUser.id) {
        throw new ForbiddenException('You cannot reassign tasks');
      }

      await this.ensureUserExists(dto.userId);
    }

    const ownerCondition =
      currentUser.role === Role.ADMIN ? {} : { userId: currentUser.id };

    const updated = await this.prisma.task.updateMany({
      where: {
        id: task.id,
        ...ownerCondition,
      },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        userId: dto.userId,
      },
    });

    if (updated.count !== 1) {
      throw new ForbiddenException(' Task no longer available for update ');
    }

    return this.findOne(id, currentUser);
  }

  async remove(id: number, currentUser: AuthenticatedUser) {
    const task = await this.findOne(id, currentUser);

    const deleted = await this.prisma.task.deleteMany({
      where: {
        id,
        ...(currentUser.role === Role.ADMIN ? {} : { userId: currentUser.id }),
      },
    });

    if (deleted.count !== 1) {
      throw new ForbiddenException('Task no longer availale for deletion');
    }

    return {
      message: 'Task Deleted Successfully',
    };
  }

  async findAll(query: TaskQueryDto, currentUser: AuthenticatedUser) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (userId) {
      where.userId = userId;
    }

    if (currentUser.role === Role.USER) {
      where.userId = currentUser.id; // if user role is user and set other user's id . it will overwrite with currentUser.id
    } else if (query.userId !== undefined) {
      where.userId = query.userId;
    }
    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: this.taskInclude,
      }),

      this.prisma.task.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // nested task list
  async findUserTasks(
    userId: number,
    query: TaskQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    if (currentUser.role !== Role.ADMIN && currentUser.id !== userId) {
      throw new ForbiddenException('You cannot view others tasks');
    }

    await this.ensureUserExists(userId);

    return this.findAll(
      {
        ...query,
        userId,
      },
      currentUser,
    );
  }

  async createUserTasks(
    userId: number,
    dto: CreateUserTaskDto,
    currentUser: AuthenticatedUser,
  ) {
    if (currentUser.role !== Role.ADMIN && currentUser.id !== userId) {
      throw new ForbiddenException('You cannot create task as another user');
    }

    await this.ensureUserExists(userId);

    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
      },
      include: this.taskInclude,
    });
  }
}
