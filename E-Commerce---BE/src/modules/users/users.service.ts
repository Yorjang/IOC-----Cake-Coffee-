import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

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
}

