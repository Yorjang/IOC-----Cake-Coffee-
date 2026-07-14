import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  Matches,
  ValidateNested,
} from "class-validator";
import { DayOfWeek } from "../branch-opening-hour.entity";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class UpsertOpeningHourDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsOptional()
  @Matches(TIME_PATTERN, {
    message: "openingTime must use HH:mm or HH:mm:ss format",
  })
  openingTime?: string | null;

  @IsOptional()
  @Matches(TIME_PATTERN, {
    message: "closingTime must use HH:mm or HH:mm:ss format",
  })
  closingTime?: string | null;

  @IsBoolean()
  isClosed: boolean;
}

export class UpdateOpeningHoursDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => UpsertOpeningHourDto)
  openingHours: UpsertOpeningHourDto[];
}
