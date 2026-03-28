import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @ApiProperty({ enum: Role, example: Role.EMPLOYEE })
  @IsEnum(Role, { message: 'role must be either ADMIN or EMPLOYEE' })
  role: Role;
}
