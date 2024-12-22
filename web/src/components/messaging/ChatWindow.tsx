'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatTime } from '@/lib/utils';
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
  status: 'sent' | 'delivered' | 'read';
}

interface ChatParticipant {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
}

interface ChatWindowProps {
  chatId: string;
  recipient: ChatParticipant;
}

export function ChatWindow({ chatId, recipient }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      scrollToBottom();
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
          scrollToBottom();
        }
      )
      .on(
        'presence',
        { event: 'sync' },
        () => {
          // Handle presence changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !fileInputRef.current?.files?.length) return;

    setIsLoading(true);
    try {
      let attachments = [];

      // Handle file uploads if any
      if (fileInputRef.current?.files?.length) {
        for (const file of Array.from(fileInputRef.current.files)) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${chatId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);

          attachments.push({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: publicUrl,
            name: file.name,
          });
        }
      }

      // Send message
      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: user?.id,
        content: newMessage,
        attachments,
      });

      if (error) throw error;

      setNewMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Image
              src={
                recipient.avatar_url ||
                `https://api.dicebear.com/6.x/avataaars/svg?seed=${recipient.username}`
              }
              alt={recipient.full_name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black ${
                recipient.is_online ? 'bg-green-500' : 'bg-gray-500'
              }`}
            />
          </div>
          <div>
            <h3 className="font-medium text-white">{recipient.full_name}</h3>
            <p className="text-sm text-gray-400">
              {recipient.is_online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender_id === user?.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {message.content && <p>{message.content}</p>}
              {message.attachments?.map((attachment, index) => (
                <div key={index} className="mt-2">
                  {attachment.type === 'image' ? (
                    <Image
                      src={attachment.url}
                      alt="Attachment"
                      width={300}
                      height={200}
                      className="rounded-lg"
                    />
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm hover:underline"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>{attachment.name}</span>
                    </a>
                  )}
                </div>
              ))}
              <div
                className={`mt-1 text-xs ${
                  message.sender_id === user?.id
                    ? 'text-white/70'
                    : 'text-gray-400'
                }`}
              >
                {formatTime(message.created_at)}
                {message.sender_id === user?.id && (
                  <span className="ml-2">{message.status}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg bg-gray-800 p-3">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleSend}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileClick}
            className="text-gray-400 hover:text-gray-300"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileClick}
            className="text-gray-400 hover:text-gray-300"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || (!newMessage.trim() && !fileInputRef.current?.files?.length)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}