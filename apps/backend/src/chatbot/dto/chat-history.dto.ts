import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClearChatHistoryDto {
  @ApiProperty({
    description: 'The session ID to clear history for',
    example: 'session-abc123',
  })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
