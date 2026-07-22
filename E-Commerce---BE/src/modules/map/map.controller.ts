import { Controller, Get, Query } from '@nestjs/common';
import { MapService } from './map.service';

@Controller(['admin/map', 'map'])
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get()
  getMapData() {
    return this.mapService.getMapBranches();
  }

  @Get('branches')
  getMapBranches() {
    return this.mapService.getMapBranches();
  }

  @Get('nearest')
  findNearest(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.mapService.findNearest(Number(lat), Number(lng));
  }

  @Get('nearby')
  findNearby(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.mapService.findNearby(Number(lat), Number(lng));
  }
}
