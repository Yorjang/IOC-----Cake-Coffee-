import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BranchesController } from "./branches.controller";
import { BranchesService } from "./branches.service";
import { Branch } from "./branch.entity";
import { UsersModule } from "../users/users.module";
import { BranchOpeningHour } from "./branch-opening-hour.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Branch, BranchOpeningHour]), UsersModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService, TypeOrmModule],
})
export class BranchesModule {}
