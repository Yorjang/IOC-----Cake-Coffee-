"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(registerDto) {
        if (!registerDto.email && !registerDto.phone) {
            throw new common_1.BadRequestException('Email or phone must be provided');
        }
        if (registerDto.email) {
            const existingEmail = await this.usersRepository.findOne({ where: { email: registerDto.email } });
            if (existingEmail) {
                throw new common_1.BadRequestException('Email already exists');
            }
        }
        if (registerDto.phone) {
            const existingPhone = await this.usersRepository.findOne({ where: { phone: registerDto.phone } });
            if (existingPhone) {
                throw new common_1.BadRequestException('Phone number already exists');
            }
        }
        const user = this.usersRepository.create({
            fullName: registerDto.fullName,
            email: registerDto.email,
            phone: registerDto.phone,
            passwordHash: registerDto.password,
            isActive: !registerDto.email,
            role: user_entity_1.UserRole.CUSTOMER,
        });
        return this.usersRepository.save(user);
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findByPhone(phone) {
        return this.usersRepository.findOne({ where: { phone } });
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async update(id, attrs) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        Object.assign(user, attrs);
        return this.usersRepository.save(user);
    }
    async findAll() {
        return this.usersRepository.find({
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                branchId: true,
                isActive: true,
                emailVerifiedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async updateRole(id, role) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        user.role = role;
        const savedUser = await this.usersRepository.save(user);
        const { passwordHash: _, ...result } = savedUser;
        return result;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map