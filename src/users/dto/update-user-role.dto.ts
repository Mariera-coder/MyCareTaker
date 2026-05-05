import { IsEnum } from 'class-validator';
import { Role } from '../../common/types';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role;
}
