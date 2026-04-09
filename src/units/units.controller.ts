import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
    constructor(private readonly unitsService: UnitsService) { }

    @Post()
    @Roles(Role.ADMIN, Role.OWNER, Role.CARETAKER)
    create(
        @Body()
        data: {
            unit_number: string;
            estate_id: string;
            monthly_rent: number;
            description?: string;
        },
    ) {
        return this.unitsService.create(data);
    }

    @Get('estate/:estateId')
    findByEstate(@Param('estateId') estateId: string) {
        return this.unitsService.findByEstate(estateId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.unitsService.findOne(id);
    }
}
