import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Permission } from "../../common/constants/permissions";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { User, UserRole } from "../users/user.entity";
import { BranchesService } from "./branches.service";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { UpdateOpeningHoursDto } from "./dto/upsert-opening-hour.dto";

@Controller(["admin/branches", "branches"])
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_BRANCHES)
  findAll() {
    return this.branchesService.findAll();
  }

  @Get("active")
  findActive() {
    return this.branchesService.findActive();
  }

  @Get("nearest")
  findNearest(@Query("lat") lat: string, @Query("lng") lng: string) {
    return this.branchesService.findNearest(Number(lat), Number(lng));
  }

  @Get("nearby")
  findNearby(@Query("lat") lat: string, @Query("lng") lng: string) {
    return this.branchesService.findNearby(Number(lat), Number(lng));
  }

  @Get(":id/opening-hours")
  getOpeningHours(@Param("id", ParseUUIDPipe) id: string) {
    return this.branchesService.getOpeningHours(id);
  }

  @Get(":id/open-status")
  getOpenStatus(@Param("id", ParseUUIDPipe) id: string) {
    return this.branchesService.getOpenStatus(id);
  }

  @Patch(":id/opening-hours")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  updateOpeningHours(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpeningHoursDto,
    @CurrentUser() user: User,
  ) {
    return this.branchesService.updateOpeningHours(id, dto, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @CurrentUser() user: User,
  ) {
    return this.branchesService.update(id, updateBranchDto, user);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.branchesService.delete(id);
  }
}
