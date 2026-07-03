import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) {}

    async register(registerDto: RegisterDto) {
        const saltOrRounds = 10;
        const passwordHash = await bcrypt.hash(registerDto.password, saltOrRounds);

        const newUser = await this.usersService.create({
        ...registerDto,
        password: passwordHash, // pass the hashed password
        });

        // Don't return the password hash
        const { passwordHash: _, ...result } = newUser;
        return result;
    }
}
