import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { MapController } from './map.controller';
import { MapService } from './map.service';

@Module({
  imports: [BranchesModule],
  controllers: [MapController],
  providers: [MapService],
  exports: [MapService],
})
export class MapModule {}
