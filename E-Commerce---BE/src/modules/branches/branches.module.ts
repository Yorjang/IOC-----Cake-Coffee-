import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { BranchOpeningHour } from "./branch-opening-hour.entity";
import { Branch } from "./branch.entity";
import { BranchesController } from "./branches.controller";
import { BranchesService } from "./branches.service";

@Module({
  imports: [TypeOrmModule.forFeature([Branch, BranchOpeningHour]), UsersModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService, TypeOrmModule],
})
export class BranchesModule {}
