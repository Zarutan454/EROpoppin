import React, { useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Box, useTheme } from '@mui/material';
import { ChatMessage } from '../../types/chat';
import { ChatMessageItem } from './ChatMessageItem';

interface VirtualizedChatListProps {
  messages: ChatMessage[];
  currentUserId: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

const ITEM_SIZE = 72; // Durchschnittliche Höhe einer Nachricht

export const VirtualizedChatList: React.FC<VirtualizedChatListProps> = ({
  messages,
  currentUserId,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}) => {
  const theme = useTheme();
  const listRef = useRef<List>(null);
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messages.length > prevMessagesLength.current) {
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    const isOwn = message.senderId === currentUserId;

    return (
      <div style={style}>
        <ChatMessageItem
          message={message}
          isOwn={isOwn}
          showAvatar={true}
        />
      </div>
    );
  };

  const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
    if (
      scrollOffset === 0 &&
      hasMore &&
      !isLoading &&
      onLoadMore
    ) {
      onLoadMore();
    }
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            itemCount={messages.length}
            itemSize={ITEM_SIZE}
            width={width}
            onScroll={handleScroll}
            initialScrollOffset={messages.length * ITEM_SIZE}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </Box>
  );
};