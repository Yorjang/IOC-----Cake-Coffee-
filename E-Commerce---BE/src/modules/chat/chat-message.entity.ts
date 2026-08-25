import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('chat_messages')
@Index('idx_chat_messages_session_created_at', ['sessionId', 'createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ type: 'varchar', length: 20 })
  role: ChatMessageRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
