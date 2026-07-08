import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly historyLimit: number;
  private readonly systemPrompt: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    this.model = this.configService.get<string>('OPENROUTER_MODEL') || 'nvidia/nemotron-3-nano-30b-a3b:free';
    this.historyLimit = parseInt(this.configService.get<string>('CHAT_HISTORY_LIMIT') || '10', 10);

    this.systemPrompt = `You are a helpful AI assistant for a restaurant delivery application. You can help customers with:

1. **Restaurant Assistance:**
   - Menu recommendations and descriptions
   - Order status and delivery tracking
   - Special dietary requirements (vegetarian, spicy options)
   - Restaurant location and hours

2. **Customer Support:**
   - Account management help
   - Order modification and cancellation
   - Payment and billing questions
   - Delivery address management

3. **General Conversation:**
   - Friendly greetings and small talk
   - General knowledge questions

Guidelines:
- Be friendly, concise, and helpful
- If you don't know something specific about the order, suggest the customer check their order status
- For account issues, recommend contacting customer support for sensitive matters
- Keep responses brief and conversational
- Use appropriate formatting for readability

Current context: You are assisting through the customer-facing chat interface.`;

    if (!this.apiKey) {
      this.logger.warn('OpenRouter API key not configured');
    }
  }

  /**
   * Send a chat message and get AI response
   */
  async sendMessage(customerId: number, message: string, sessionId?: string): Promise<{
    success: boolean;
    response: string;
    sessionId: string;
  }> {
    try {
      // Generate or use existing session ID
      const currentSessionId = sessionId || randomUUID();

      // Get or create chat session
      let session = await this.prisma.chatSession.findUnique({
        where: { sessionId: currentSessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!session) {
        session = await this.prisma.chatSession.create({
          data: {
            customerId,
            sessionId: currentSessionId,
          },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        this.logger.log(`Created new chat session: ${currentSessionId} for customer: ${customerId}`);
      } else {
        // Update last active timestamp
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { lastActiveAt: new Date() },
        });
      }

      // Store user message
      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: message,
        },
      });

      // Prepare messages for AI (including history)
      const messages: ChatMessage[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Add recent message history (limited by historyLimit)
      const recentMessages = session.messages.slice(-this.historyLimit);
      for (const msg of recentMessages) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }

      // Add current message
      messages.push({ role: 'user', content: message });

      // Call OpenRouter API
      const aiResponse = await this.callOpenRouter(messages);

      // Store AI response
      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: aiResponse,
        },
      });

      this.logger.log(`Chat message processed for session: ${currentSessionId}`);

      return {
        success: true,
        response: aiResponse,
        sessionId: currentSessionId,
      };
    } catch (error) {
      this.logger.error(`Failed to send chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get chat history for a session
   */
  async getChatHistory(sessionId: string): Promise<{
    success: boolean;
    session: {
      sessionId: string;
      messages: Array<{
        role: string;
        content: string;
        createdAt: Date;
      }>;
    } | null;
  }> {
    try {
      const session = await this.prisma.chatSession.findUnique({
        where: { sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!session) {
        return {
          success: false,
          session: null,
        };
      }

      return {
        success: true,
        session: {
          sessionId: session.sessionId,
          messages: session.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
          })),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Clear chat history for a session
   */
  async clearChatHistory(sessionId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Delete all messages for the session
      await this.prisma.chatMessage.deleteMany({
        where: {
          session: { sessionId },
        },
      });

      this.logger.log(`Cleared chat history for session: ${sessionId}`);

      return {
        success: true,
        message: 'Chat history cleared successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to clear chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const request: OpenRouterRequest = {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      };

      this.logger.debug(`Sending request to OpenRouter: ${JSON.stringify({ model: this.model, messageCount: messages.length })}`);

      const response = await firstValueFrom(
        this.httpService.post<OpenRouterResponse>(this.apiUrl, request, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://restaurant-delivery-app.com',
            'X-Title': 'Restaurant Delivery App',
          },
          timeout: 30000,
        }),
      );

      if (response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message.content;
        this.logger.debug(`Received response from OpenRouter: ${content.substring(0, 100)}...`);
        return content;
      }

      throw new Error('No response from OpenRouter');
    } catch (error) {
      this.logger.error(`OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('AI response timeout. Please try again.');
      }

      throw new Error('Failed to get AI response. Please try again later.');
    }
  }
}
