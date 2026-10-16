import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserTaskDto } from '../tasks/dto/create-user-task.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email Already Exists');
    }

    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        age: createUserDto.age,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: {
            id,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      return this.prisma.user.update({
        where: { id },
        data: {
          name: updateUserDto.name,
          email: updateUserDto.email,
          age: updateUserDto.age,
        },
      });
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.user.delete({
      where: {
        id,
      },
    });

    return {
      message: 'User deleted successfully',
    };
  }

  // async findUserTasks(userId: number) {
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       id: userId,
  //     },
  //     include: {
  //       tasks: {
  //         orderBy: {
  //           createdAt: 'desc',
  //         },
  //       },
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`User with id ${userId} not found`);
  //   }

  //   return user;
  // }

  async findUserTasks(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }

  async createUserTask(userId: number, dto: CreateUserTaskDto) {
    await this.findOne(userId);

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        userId,
      },
    });
  }
}
