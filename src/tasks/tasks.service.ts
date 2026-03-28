import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Role } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    const { title, description, assignedTo, customerId, status } =
      createTaskDto;

    // Validate assigned user exists and is EMPLOYEE
    const user = await this.prisma.user.findUnique({
      where: { id: assignedTo },
    });
    if (!user || user.role !== Role.EMPLOYEE) {
      throw new NotFoundException(
        `Valid employee with ID ${assignedTo} not found`,
      );
    }

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.prisma.task.create({
      data: {
        title,
        description,
        status,
        assignedToId: assignedTo,
        customerId,
      },
    });
  }

  async findAll(userRole: Role, userId: string) {
    const whereClause = userRole === Role.ADMIN ? {} : { assignedToId: userId };

    return this.prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: number,
    updateTaskStatusDto: UpdateTaskStatusDto,
    userRole: Role,
    userId: string,
  ) {
    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // RBAC Ownership Check
    if (userRole === Role.EMPLOYEE && task.assignedToId !== userId) {
      throw new ForbiddenException('You can only update tasks assigned to you');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: updateTaskStatusDto.status },
    });
  }
}
