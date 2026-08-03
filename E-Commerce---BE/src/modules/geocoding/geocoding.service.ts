import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface VietMapSearchResult {
  ref_id: string;
  display?: string;
  name?: string;
  address?: string;
}

interface VietMapPlaceResult {
  display?: string;
  name?: string;
  address?: string;
  lat: number;
  lng: number;
}

@Injectable()
export class GeocodingService {
  private readonly apiUrl = 'https://maps.vietmap.vn/api';

  constructor(private readonly configService: ConfigService) {}

  async autocomplete(text: string) {
    if (!text?.trim() || text.trim().length < 3) return [];
    const results = await this.request<VietMapSearchResult[]>('/autocomplete/v4', {
      text: text.trim(),
      display_type: '5',
    });
    return results.slice(0, 6).map((item) => ({
      id: item.ref_id,
      refId: item.ref_id,
      label: item.display || [item.name, item.address].filter(Boolean).join(', '),
      primaryText: item.name || item.display || 'Địa chỉ',
      secondaryText: item.address || item.display || '',
      latitude: null,
      longitude: null,
    }));
  }

  async place(refId: string) {
    if (!refId?.trim()) throw new BadRequestException('Thiếu mã địa chỉ');
    const item = await this.request<VietMapPlaceResult>('/place/v4', { refid: refId });
    return this.mapPlace(item, refId);
  }

  async reverse(latitude: number, longitude: number) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('Tọa độ không hợp lệ');
    }
    const result = await this.request<VietMapPlaceResult | VietMapPlaceResult[]>('/reverse/v4', {
      lat: String(latitude),
      lng: String(longitude),
      display_type: '5',
    });
    const item = Array.isArray(result) ? result[0] : result;
    return item ? this.mapPlace(item, `reverse-${latitude}-${longitude}`) : null;
  }

  private mapPlace(item: VietMapPlaceResult, id: string) {
    const label = item.display || item.address || item.name || '';
    return {
      id,
      label,
      primaryText: item.name || item.address || label,
      secondaryText: label,
      latitude: Number(item.lat),
      longitude: Number(item.lng),
    };
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const apiKey = this.configService.get<string>('VIETMAP_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException('Chưa cấu hình VIETMAP_API_KEY');
    const url = new URL(`${this.apiUrl}${path}`);
    url.searchParams.set('apikey', apiKey);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    const response = await fetch(url);
    if (!response.ok) throw new ServiceUnavailableException('Dịch vụ địa chỉ VietMap tạm thời không khả dụng');
    return response.json() as Promise<T>;
  }
}
