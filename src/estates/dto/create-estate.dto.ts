import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateEstateDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    address!: string;

    @IsString()
    @IsNotEmpty()
    city!: string;

    @IsUUID()
    owner_user_id!: string;
}
