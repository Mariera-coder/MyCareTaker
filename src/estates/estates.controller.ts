import {
  Patch,
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { EstatesService } from './estates.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, Role } from '../common/types';
import { CreateEstateDto } from './dto/create-estate.dto';
import { AssignCaretakerDto } from './dto/assign-caretaker.dto';
import { ReplaceCaretakerDto } from './dto/replace-caretaker.dto';
import { UpdateEstateFinancialSettingsDto } from './dto/update-estate-financial-settings.dto';

@Controller('estates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EstatesController {
  constructor(private readonly estatesService: EstatesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() data: CreateEstateDto) {
    return this.estatesService.create(data);
  }

  @Post(':id/caretakers')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  assignCaretaker(@Param('id') id: string, @Body() body: AssignCaretakerDto) {
    return this.estatesService.assignCaretaker(id, body.user_id);
  }

  @Post(':id/caretakers/replace')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  replaceCaretaker(
    @Param('id') id: string,
    @Body() body: ReplaceCaretakerDto,
  ) {
    return this.estatesService.replaceCaretaker(
      id,
      body.outgoing_user_id,
      body.incoming_user_id,
      body.deactivateOutgoing ?? false,
    );
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.estatesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.estatesService.findOne(id, user);
  }

  @Patch(':id/financial-settings')
  @Roles(Role.ADMIN, Role.OWNER)
  updateFinancialSettings(
    @Param('id') id: string,
    @Body() body: UpdateEstateFinancialSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estatesService.updateFinancialSettings(id, body, user);
  }
}
