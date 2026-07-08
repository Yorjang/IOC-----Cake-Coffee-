import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(registerDto: RegisterDto): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    update(id: string, attrs: Partial<User>): Promise<User>;
    findAll(): Promise<User[]>;
    updateRole(id: string, role: UserRole): Promise<User>;
    updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User>;
    changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
