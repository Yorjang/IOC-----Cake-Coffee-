import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  createSession() {
    return this.chatService.createSession();
  }

  @Get('sessions/:sessionId/messages')
  getMessages(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.chatService.getMessages(sessionId);
  }

  @Post('sessions/:sessionId/messages')
  sendMessage(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatService.sendMessage(sessionId, dto.message);
  }
}
