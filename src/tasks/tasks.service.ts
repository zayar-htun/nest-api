import { Injectable, NotFoundException } from '@nestjs/common';
import { createTasksDto } from './dto/create-tasks.dto.js';
import { updateTasksDto } from './dto/update-tasks.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaskQueryDto } from './dto/task-query.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: createTasksDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        userId: dto.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task with that id cant find');
    }

    return task;
  }

  async update(id: number, dto: updateTasksDto) {
    await this.findOne(id);

    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: dto.userId,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${dto.userId} not found`);
      }
    }

    return this.prisma.task.update({
      where: {
        id,
      },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Task Deleted Successfully',
    };
  }

  async findAll(query: TaskQueryDto) {
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
            contain: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contain: search,
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

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
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
}
