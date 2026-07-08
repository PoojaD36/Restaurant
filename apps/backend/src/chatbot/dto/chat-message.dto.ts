import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    description: 'The message content from the user',
    example: 'What are your vegetarian options?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;

  @ApiProperty({
    description: 'Optional session ID to continue existing conversation',
    example: 'session-abc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class ChatHistoryDto {
  @ApiProperty({
    description: 'The session ID to retrieve history for',
    example: 'session-abc123',
  })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
