import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: User): User;
    findAll(): Promise<User[]>;
    updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<User>;
}
