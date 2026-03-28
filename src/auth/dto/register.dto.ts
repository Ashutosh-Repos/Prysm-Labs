import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@prysm.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.EMPLOYEE })
  @IsEnum(Role)
  role: Role;
}
