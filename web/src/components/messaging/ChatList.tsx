'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatTime } from '@/lib/utils';
import { Search } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Chat {
  id: string;
  participant: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    is_online: boolean;
  };
  last_message: {
    content: string;
    created_at: string;
    is_read: boolean;
  } | null;
  unread_count: number;
}

interface ChatListProps {
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
}

export function ChatList({ selectedChatId, onChatSelect }: ChatListProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select(
            `
            id,
            participants:chat_participants (
              user:users (
                id,
                username,
                full_name,
                avatar_url,
                is_online
              )
            ),
            messages:chat_messages (
              content,
              created_at,
              is_read,
              sender_id
            )
          `
          )
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Transform the data to match our Chat interface
        const transformedChats = data.map((chat: any) => ({
          id: chat.id,
          participant: chat.participants[0].user,
          last_message: chat.messages[0] || null,
          unread_count: chat.messages.filter(
            (m: any) => !m.is_read && m.sender_id === chat.participants[0].user.id
          ).length,
        }));

        setChats(transformedChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();

    // Subscribe to changes
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredChats = chats.filter((chat) =>
    chat.participant.full_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="flex h-full flex-col">
      {/* Search Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            placeholder="Search conversations..."
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`w-full border-b border-gray-800 p-4 transition-colors hover:bg-gray-900 ${
                selectedChatId === chat.id ? 'bg-gray-900' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Image
                    src={
                      chat.participant.avatar_url ||
                      `https://api.dicebear.com/6.x/avataaars/svg?seed=${chat.participant.username}`
                    }
                    alt={chat.participant.full_name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black ${
                      chat.participant.is_online ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">
                      {chat.participant.full_name}
                    </h3>
                    {chat.last_message && (
                      <span className="text-xs text-gray-400">
                        {formatTime(chat.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="mt-1 truncate text-sm text-gray-400">
                      {chat.last_message?.content || 'No messages yet'}
                    </p>
                    {chat.unread_count > 0 && (
                      <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs text-white">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-gray-400">No conversations found</p>
          </div>
        )}
      </div>
    </Card>
  );
}