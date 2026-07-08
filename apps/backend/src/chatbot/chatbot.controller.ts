import { Controller, Post, Get, Delete, Body, UseGuards, Request, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { CustomerJwtAuthGuard } from '../customer-module/guards/customer-jwt-auth.guard';
import { ChatMessageDto } from './dto/chat-message.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send message to AI chatbot',
    description: 'Send a message to the AI chatbot and receive a response. Supports session continuity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        response: { type: 'string', example: 'I\'d be happy to help you with our menu! We have several vegetarian options...' },
        sessionId: { type: 'string', example: 'session-abc123' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendMessage(@Request() req: any, @Body() messageDto: ChatMessageDto) {
    const customerId = req.user.customerId;
    return this.chatbotService.sendMessage(customerId, messageDto.message, messageDto.sessionId);
  }

  @Get('history/:sessionId')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get chat history',
    description: 'Retrieve the message history for a specific chat session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getChatHistory(@Param('sessionId') sessionId: string) {
    return this.chatbotService.getChatHistory(sessionId);
  }

  @Delete('history/:sessionId')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear chat history',
    description: 'Clear all messages for a specific chat session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history cleared successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearChatHistory(@Param('sessionId') sessionId: string) {
    return this.chatbotService.clearChatHistory(sessionId);
  }
}
