import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
@Public()
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('autocomplete')
  autocomplete(@Query('text') text: string) {
    return this.geocodingService.autocomplete(text);
  }

  @Get('place')
  place(@Query('refId') refId: string) {
    return this.geocodingService.place(refId);
  }

  @Get('reverse')
  reverse(@Query('lat') latitude: string, @Query('lng') longitude: string) {
    return this.geocodingService.reverse(Number(latitude), Number(longitude));
  }
}
