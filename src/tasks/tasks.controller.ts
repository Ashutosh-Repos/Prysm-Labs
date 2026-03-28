import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/get-user.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Create a task assigned to an employee (ADMIN only)',
  })
  @ApiResponse({ status: 201, description: 'Task created' })
  @ApiResponse({ status: 404, description: 'Employee or customer not found' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get()
  @ApiOperation({
    summary: 'Get all tasks based on role (ADMIN all, EMPLOYEE assigned)',
  })
  findAll(@GetUser() user: JwtPayloadUser) {
    return this.tasksService.findAll(user.role, user.id);
  }

  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a task status (ADMIN any, EMPLOYEE own)' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden from updating unassigned tasks',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetUser() user: JwtPayloadUser,
  ) {
    return this.tasksService.updateStatus(
      id,
      updateTaskStatusDto,
      user.role,
      user.id,
    );
  }
}
