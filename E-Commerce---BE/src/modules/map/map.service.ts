import { Injectable } from '@nestjs/common';
import { BranchesService } from '../branches/branches.service';

@Injectable()
export class MapService {
  constructor(private readonly branchesService: BranchesService) {}

  async getMapBranches() {
    const branches = await this.branchesService.findAll();
    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
      email: b.email,
      latitude: b.latitude ? Number(b.latitude) : null,
      longitude: b.longitude ? Number(b.longitude) : null,
      status: b.status,
      isActive: b.isActive,
    }));
  }

  findNearest(lat: number, lng: number) {
    return this.branchesService.findNearest(lat, lng);
  }

  findNearby(lat: number, lng: number) {
    return this.branchesService.findNearby(lat, lng);
  }
}
