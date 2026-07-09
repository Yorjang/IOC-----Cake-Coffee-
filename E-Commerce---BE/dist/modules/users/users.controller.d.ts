import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: User): User;
    findAll(): Promise<User[]>;
    updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<User>;
    updateProfile(user: User, updateProfileDto: UpdateProfileDto): Promise<User>;
    changePassword(user: User, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
}
