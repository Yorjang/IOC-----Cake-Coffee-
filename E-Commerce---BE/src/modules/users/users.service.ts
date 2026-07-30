import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { Branch } from '../branches/branch.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private users: Repository<User>,
        @InjectRepository(Branch)
        private branches: Repository<Branch>,
    ) {}

    async create(registerDto: RegisterDto): Promise<User> {
        if (!registerDto.email && !registerDto.phone) {
            throw new BadRequestException('Email or phone must be provided');
        }

        // Check if user exists
        if (registerDto.email) {
            const existingEmail = await this.users.findOne({ where: { email: registerDto.email } });
            if (existingEmail) {
                throw new BadRequestException('Email already exists');
            }
        }

        if (registerDto.phone) {
            const existingPhone = await this.users.findOne({ where: { phone: registerDto.phone } });
            if (existingPhone) {
                throw new BadRequestException('Phone number already exists');
            }
        }

        const user = this.users.create({
            fullName: registerDto.fullName,
            email: registerDto.email,
            phone: registerDto.phone,
            passwordHash: registerDto.password, // Password hashing will be handled in AuthService
            isActive: !registerDto.email, // Inactive if registration has email (requires verification)
            role: UserRole.CUSTOMER,
        });

        return this.users.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.users.findOne({ where: { email } });
    }

    async findByPhone(phone: string): Promise<User | null> {
        return this.users.findOne({ where: { phone } });
    }

    async findById(id: string): Promise<User | null> {
        return this.users.findOne({ where: { id } });
    }

    async update(id: string, attrs: Partial<User>): Promise<User> {
        const user = await this.users.findOne({ where: { id } });
        if (!user) {
            throw new BadRequestException('User not found');
        }
        Object.assign(user, attrs);
        return this.users.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.users.find({
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                address: true,
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
        const savedUser = await this.users.save(user);
        
        // Remove password hash from returned object
        const { passwordHash: _, ...result } = savedUser;
        return result as any;
    }

    private async assertBranchForRole(role: UserRole, branchId?: string | null) {
        const branchRequiredRoles = [UserRole.STAFF, UserRole.CASHIER, UserRole.STORE_MANAGER];
        if (!branchRequiredRoles.includes(role)) {
            return null;
        }

        if (!branchId) {
            throw new BadRequestException('Branch is required for staff, cashier and store manager accounts');
        }

        const branch = await this.branches.findOne({ where: { id: branchId } });
        if (!branch || !branch.isActive) {
            throw new BadRequestException('Branch not found or inactive');
        }

        return branch;
    }

    async createByAdmin(createUserDto: CreateUserDto): Promise<User> {
        const nextEmail = createUserDto.email === '' ? null : createUserDto.email;
        const nextPhone = createUserDto.phone === '' ? null : createUserDto.phone;

        if (!nextEmail && !nextPhone) {
            throw new BadRequestException('Email or phone must be provided');
        }

        if (nextEmail) {
            const existingEmail = await this.users.findOne({ where: { email: nextEmail } });
            if (existingEmail) {
                throw new BadRequestException('Email already exists');
            }
        }

        if (nextPhone) {
            const existingPhone = await this.users.findOne({ where: { phone: nextPhone } });
            if (existingPhone) {
                throw new BadRequestException('Phone number already exists');
            }
        }

        await this.assertBranchForRole(createUserDto.role, createUserDto.branchId);

        const branchFreeRoles = [UserRole.CUSTOMER, UserRole.GUEST, UserRole.ADMIN];
        const passwordHash = await bcrypt.hash(createUserDto.password, 10);
        const user = this.users.create({
            fullName: createUserDto.fullName,
            email: nextEmail,
            phone: nextPhone,
            passwordHash,
            role: createUserDto.role,
            branchId: branchFreeRoles.includes(createUserDto.role) ? null : createUserDto.branchId,
            isActive: createUserDto.isActive ?? true,
            emailVerifiedAt: nextEmail ? new Date() : null,
        });

        const savedUser = await this.users.save(user);
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
        const nextRole = updateUserDto.role ?? user.role;
        const nextBranchId = updateUserDto.branchId === '' ? null : updateUserDto.branchId;

        if (nextEmail && nextEmail !== user.email) {
            const existingEmail = await this.users.findOne({ where: { email: nextEmail } });
            if (existingEmail && existingEmail.id !== id) {
                throw new BadRequestException('Email already exists');
            }
        }

        if (nextPhone && nextPhone !== user.phone) {
            const existingPhone = await this.users.findOne({ where: { phone: nextPhone } });
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
        if (updateUserDto.branchId !== undefined) {
            user.branchId = nextBranchId;
        }
        if (updateUserDto.isActive !== undefined) {
            user.isActive = updateUserDto.isActive;
        }

        if (!user.email && !user.phone) {
            throw new BadRequestException('Email or phone must be provided');
        }

        await this.assertBranchForRole(nextRole, user.branchId);
        if ([UserRole.CUSTOMER, UserRole.GUEST, UserRole.ADMIN].includes(nextRole)) {
            user.branchId = null;
        }

        const savedUser = await this.users.save(user);
        const { passwordHash: _, ...result } = savedUser;
        return result as any;
    }

    async deleteUser(id: string): Promise<{ message: string }> {
        const user = await this.findById(id);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        await this.users.delete(id);
        return { message: 'User deleted successfully' };
    }

    async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (updateProfileDto.phone && updateProfileDto.phone !== user.phone) {
            const existingPhone = await this.users.findOne({
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
        if (updateProfileDto.address !== undefined) {
            user.address = updateProfileDto.address;
        }

        const savedUser = await this.users.save(user);
        
        // Remove password hash from returned object
        const { passwordHash: _, ...result } = savedUser;
        return result as any;
    }

    async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
        const user = await this.users.findOne({ where: { id } });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(changePasswordDto.oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new BadRequestException('Mật khẩu cũ không chính xác');
        }

        const saltOrRounds = 10;
        user.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, saltOrRounds);
        await this.users.save(user);

        return { message: 'Đổi mật khẩu thành công' };
    }
}

