import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ReplaceCaretakerDto {
  @IsUUID()
  outgoing_user_id!: string;

  @IsUUID()
  incoming_user_id!: string;

  @IsOptional()
  @IsBoolean()
  deactivateOutgoing?: boolean;
}
