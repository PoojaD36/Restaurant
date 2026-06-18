import { Injectable } from '@nestjs/common';
import { UpdateUserModuleDto } from './dto/update-user-module.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UserModuleService {
  constructor(private readonly prisma: PrismaService) {}

  // NOTE: User creation is handled by AuthService
  // Use /auth/setup for initial Super Admin creation
  // Use /auth/register-user (Super Admin only) for creating other users

  findAll() {
    return `This action returns all userModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userModule`;
  }

  update(id: number, updateUserModuleDto: UpdateUserModuleDto) {
    return `This action updates a #${id} userModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} userModule`;
  }
}
