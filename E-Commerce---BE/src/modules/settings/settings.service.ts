import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async findAll() {
    const defaultSettings: Record<string, string> = {
      store_name: 'Sweet Bean Cake & Coffee',
      hotline: '1900 1234',
      support_email: 'support@sweetbean.com',
      currency: 'VND',
      default_shipping_fee: '20000',
      vat_percentage: '8',
      maintenance_mode: 'false',
    };

    let settings: Setting[] = [];
    try {
      settings = await this.settingRepository.find();
    } catch {
      return defaultSettings;
    }

    const resultMap: Record<string, any> = { ...defaultSettings };
    for (const item of settings) {
      resultMap[item.key] = item.value;
    }
    return resultMap;
  }

  async findByKey(key: string) {
    try {
      return await this.settingRepository.findOne({ where: { key } });
    } catch {
      return null;
    }
  }

  async updateSetting(dto: UpdateSettingDto) {
    try {
      let setting = await this.settingRepository.findOne({ where: { key: dto.key } });
      if (!setting) {
        setting = this.settingRepository.create({ key: dto.key, value: dto.value, description: dto.description });
      } else {
        if (dto.value !== undefined) setting.value = dto.value;
        if (dto.description !== undefined) setting.description = dto.description;
      }
      return await this.settingRepository.save(setting);
    } catch {
      return { key: dto.key, value: dto.value };
    }
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
