import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async findAll() {
    const settings = await this.settingRepository.find();
    const defaultSettings: Record<string, string> = {
      store_name: 'Sweet Bean Cake & Coffee',
      hotline: '1900 1234',
      support_email: 'support@sweetbean.com',
      currency: 'VND',
      default_shipping_fee: '20000',
      vat_percentage: '8',
      maintenance_mode: 'false',
    };

    const resultMap: Record<string, any> = { ...defaultSettings };
    for (const item of settings) {
      resultMap[item.key] = item.value;
    }
    return resultMap;
  }

  async findByKey(key: string) {
    return this.settingRepository.findOne({ where: { key } });
  }

  async updateSetting(dto: UpdateSettingDto) {
    let setting = await this.settingRepository.findOne({ where: { key: dto.key } });
    if (!setting) {
      setting = this.settingRepository.create({ key: dto.key, value: dto.value, description: dto.description });
    } else {
      if (dto.value !== undefined) setting.value = dto.value;
      if (dto.description !== undefined) setting.description = dto.description;
    }
    return this.settingRepository.save(setting);
  }

  async bulkUpdate(dtos: UpdateSettingDto[]) {
    const results = [];
    for (const dto of dtos) {
      const updated = await this.updateSetting(dto);
      results.push(updated);
    }
    return results;
  }
}
