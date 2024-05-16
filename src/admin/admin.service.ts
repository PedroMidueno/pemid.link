import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'

import * as bcrypt from 'bcrypt'

import { UpdateUserDto, CreateUserDto, UpdatePasswordDto } from './dto'
import { PrismaService } from 'src/common/prisma.service'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) { }

  async validatePasswordToUpdate(password: string, userId: number) {
    const passwordInDb = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        password: true
      }
    })

    const equals = bcrypt.compareSync(password, passwordInDb.password)

    return {
      equals
    }
  }

  async changeUserPassword(updatePasswordDto: UpdatePasswordDto, userId: number) {
    const { oldPassword, newPassword } = updatePasswordDto
    const { equals } = await this.validatePasswordToUpdate(oldPassword, userId)

    if (!equals)
      throw new BadRequestException('given password does not match with current password')

    await this.prisma.users.update({
      where: {
        id: userId
      },
      data: {
        password: await bcrypt.hash(newPassword, 10)
      }
    })
  }

  async createUser(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto

    try {
      await this.prisma.users.create({
        data: {
          ...userData,
          password: await bcrypt.hash(password, 10)
        }
      })
    } catch (error) {
      if (error?.code === 'P2002')
        throw new BadRequestException('there is already an account with this email')

      throw new InternalServerErrorException(error.message)
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    await this.prisma.users.update({
      where: { id },
      data: { ...updateUserDto, modifiedAt: new Date() }
    })
  }

  async deleteUser(id: number) {
    await this.prisma.users.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() }
    })
  }
}
