import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Permissions(Permission.VIEW_BRANCHES)
  findAll() {
    return this.branchesService.findAll();
  }

  @Get('active')
  @Permissions(Permission.VIEW_BRANCHES)
  findActive() {
    return this.branchesService.findActive();
  }

  @Post()
  @Permissions(Permission.MANAGE_BRANCHES)
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Patch(':id')
  @Permissions(Permission.MANAGE_BRANCHES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @Permissions(Permission.MANAGE_BRANCHES)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.delete(id);
  }
}
