import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Follow up with client' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Discuss the new contract details' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'user-uuid-here', description: 'Employee User ID' })
  @IsUUID()
  @IsNotEmpty()
  assignedTo: string;

  @ApiProperty({ example: 1, description: 'Customer ID' })
  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.PENDING })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus = TaskStatus.PENDING;
}
