import { IsUUID } from 'class-validator';

export class AssignCaretakerDto {
  @IsUUID()
  user_id!: string;
}
