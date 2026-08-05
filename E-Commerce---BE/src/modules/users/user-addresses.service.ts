import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { UserAddress } from './user-address.entity';

@Injectable()
export class UserAddressesService {
  constructor(
    @InjectRepository(UserAddress) private readonly addresses: Repository<UserAddress>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(userId: string): Promise<UserAddress[]> {
    return this.addresses.find({ where: { userId }, order: { isDefault: 'DESC', updatedAt: 'DESC' } });
  }

  async create(userId: string, dto: CreateUserAddressDto): Promise<UserAddress> {
    return this.dataSource.transaction(async manager => {
      const repository = manager.getRepository(UserAddress);
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`user-addresses:${userId}`]);
      await this.assertNotDuplicate(repository, userId, dto);

      const count = await repository.count({ where: { userId } });
      const shouldBeDefault = count === 0 || dto.isDefault === true;
      if (shouldBeDefault) await repository.update({ userId }, { isDefault: false });

      return repository.save(repository.create({
        ...dto,
        recipientName: this.normalizeText(dto.recipientName),
        phone: dto.phone.trim(),
        address: this.normalizeText(dto.address),
        userId,
        isDefault: shouldBeDefault,
      }));
    });
  }

  async update(userId: string, id: string, dto: UpdateUserAddressDto): Promise<UserAddress> {
    return this.dataSource.transaction(async manager => {
      const repository = manager.getRepository(UserAddress);
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`user-addresses:${userId}`]);

      const address = await repository.findOne({ where: { id, userId } });
      if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');

      await this.assertNotDuplicate(repository, userId, {
        recipientName: dto.recipientName ?? address.recipientName,
        phone: dto.phone ?? address.phone,
        address: dto.address ?? address.address,
      }, id);

      if (dto.isDefault === true) await repository.update({ userId }, { isDefault: false });
      Object.assign(address, dto);
      address.recipientName = this.normalizeText(address.recipientName);
      address.phone = address.phone.trim();
      address.address = this.normalizeText(address.address);
      return repository.save(address);
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.dataSource.transaction(async manager => {
      const repository = manager.getRepository(UserAddress);
      const address = await repository.findOne({ where: { id, userId } });
      if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');
      await repository.remove(address);
      if (address.isDefault) {
        const next = await repository.findOne({ where: { userId }, order: { updatedAt: 'DESC' } });
        if (next) await repository.update(next.id, { isDefault: true });
      }
    });
  }

  private normalizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private async assertNotDuplicate(
    repository: Repository<UserAddress>,
    userId: string,
    candidate: Pick<UserAddress, 'recipientName' | 'phone' | 'address'>,
    excludedId?: string,
  ): Promise<void> {
    const query = repository.createQueryBuilder('savedAddress')
      .where('savedAddress.userId = :userId', { userId })
      .andWhere("LOWER(REGEXP_REPLACE(BTRIM(savedAddress.recipientName), '\\s+', ' ', 'g')) = :recipientName", {
        recipientName: this.normalizeText(candidate.recipientName).toLowerCase(),
      })
      .andWhere("REGEXP_REPLACE(savedAddress.phone, '\\D', '', 'g') = :phone", {
        phone: candidate.phone.replace(/\D/g, ''),
      })
      .andWhere("LOWER(REGEXP_REPLACE(BTRIM(savedAddress.address), '\\s+', ' ', 'g')) = :address", {
        address: this.normalizeText(candidate.address).toLowerCase(),
      });

    if (excludedId) query.andWhere('savedAddress.id != :excludedId', { excludedId });
    if (await query.getExists()) {
      throw new ConflictException('Địa chỉ này đã tồn tại trong sổ địa chỉ của bạn');
    }
  }
}
