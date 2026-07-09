import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async create(registerDto: RegisterDto): Promise<User> {
        if (!registerDto.email && !registerDto.phone) {
            throw new BadRequestException('Email or phone must be provided');
        }

        // Check if user exists
        if (registerDto.email) {
            const existingEmail = await this.usersRepository.findOne({ where: { email: registerDto.email } });
            if (existingEmail) {
                throw new BadRequestException('Email already exists');
            }
        }

        if (registerDto.phone) {
            const existingPhone = await this.usersRepository.findOne({ where: { phone: registerDto.phone } });
            if (existingPhone) {
                throw new BadRequestException('Phone number already exists');
            }
        }

        const user = this.usersRepository.create({
            fullName: registerDto.fullName,
            email: registerDto.email,
            phone: registerDto.phone,
            passwordHash: registerDto.password, // Password hashing will be handled in AuthService
            isActive: !registerDto.email, // Inactive if registration has email (requires verification)
            role: UserRole.CUSTOMER,
        });

        return this.usersRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findByPhone(phone: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { phone } });
    }

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async update(id: string, attrs: Partial<User>): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new BadRequestException('User not found');
        }
        Object.assign(user, attrs);
        return this.usersRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find({
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                branchId: true,
                isActive: true,
                emailVerifiedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async updateRole(id: string, role: UserRole): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        user.role = role;
        const savedUser = await this.usersRepository.save(user);
        
        // Remove password hash from returned object
        const { passwordHash: _, ...result } = savedUser;
        return result as any;
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const nextEmail = updateUserDto.email === '' ? null : updateUserDto.email;
        const nextPhone = updateUserDto.phone === '' ? null : updateUserDto.phone;

        if (nextEmail && nextEmail !== user.email) {
            const existingEmail = await this.usersRepository.findOne({ where: { email: nextEmail } });
            if (existingEmail && existingEmail.id !== id) {
                throw new BadRequestException('Email already exists');
            }
        }

        if (nextPhone && nextPhone !== user.phone) {
            const existingPhone = await this.usersRepository.findOne({ where: { phone: nextPhone } });
            if (existingPhone && existingPhone.id !== id) {
                throw new BadRequestException('Phone number already exists');
            }
        }

        if (updateUserDto.fullName !== undefined) {
            user.fullName = updateUserDto.fullName;
        }
        if (updateUserDto.email !== undefined) {
            user.email = nextEmail;
        }
        if (updateUserDto.phone !== undefined) {
            user.phone = nextPhone;
        }
        if (updateUserDto.role !== undefined) {
            user.role = updateUserDto.role;
        }
        if (updateUserDto.isActive !== undefined) {
            user.isActive = updateUserDto.isActive;
        }

        if (!user.email && !user.phone) {
            throw new BadRequestException('Email or phone must be provided');
        }

        const savedUser = await this.usersRepository.save(user);
        const { passwordHash: _, ...result } = savedUser;
        return result as any;
    }

    async deleteUser(id: string): Promise<{ message: string }> {
        const user = await this.findById(id);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        await this.usersRepository.delete(id);
        return { message: 'User deleted successfully' };
    }

    async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (updateProfileDto.phone && updateProfileDto.phone !== user.phone) {
            const existingPhone = await this.usersRepository.findOne({
                where: { phone: updateProfileDto.phone },
            });
            if (existingPhone && existingPhone.id !== id) {
                throw new BadRequestException('Phone number already exists');
            }
        }

        if (updateProfileDto.fullName !== undefined) {
            user.fullName = updateProfileDto.fullName;
        }
        if (updateProfileDto.phone !== undefined) {
            user.phone = updateProfileDto.phone;
        }
        if (updateProfileDto.avatar !== undefined) {
            user.avatarUrl = updateProfileDto.avatar;
        }

        const savedUser = await this.usersRepository.save(user);
        
        // Remove password hash from returned object
        const { passwordHash: _, ...result } = savedUser;
        return result as any;
    }

    async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(changePasswordDto.oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new BadRequestException('Mật khẩu cũ không chính xác');
        }

        const saltOrRounds = 10;
        user.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, saltOrRounds);
        await this.usersRepository.save(user);

        return { message: 'Đổi mật khẩu thành công' };
    }
}

