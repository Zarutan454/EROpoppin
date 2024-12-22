import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadFile } from '../services/storage';
import { sendNotification } from '../services/notifications';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { io } from '../services/websocket';

const prisma = new PrismaClient();

// Get conversations
export const getConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1_id: req.user.id },
          { user2_id: req.user.id },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
            last_seen: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
            last_seen: true,
          },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    // Transform conversations to include unread count
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversation_id: conversation.id,
            sender_id: {
              not: req.user.id,
            },
            read_at: null,
          },
        });

        const otherUser =
          conversation.user1_id === req.user.id
            ? conversation.user2
            : conversation.user1;

        return {
          id: conversation.id,
          other_user: otherUser,
          last_message: conversation.messages[0] || null,
          unread_count: unreadCount,
          updated_at: conversation.updated_at,
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    logger.error('Get conversations error:', error);
    throw error;
  }
};

// Get conversation
export const getConversation = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
            last_seen: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
            last_seen: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found');
    }

    // Check if user is part of the conversation
    if (
      conversation.user1_id !== req.user.id &&
      conversation.user2_id !== req.user.id
    ) {
      throw new ApiError(403, 'You are not part of this conversation');
    }

    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.message.count({
      where: { conversation_id: conversationId },
    });

    res.json({
      conversation: {
        id: conversation.id,
        other_user:
          conversation.user1_id === req.user.id
            ? conversation.user2
            : conversation.user1,
      },
      messages: messages.reverse(),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Get conversation error:', error);
    throw error;
  }
};

// Create conversation
export const createConversation = async (req: Request, res: Response) => {
  const { recipient_id } = req.body;

  try {
    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1_id: req.user.id,
            user2_id: recipient_id,
          },
          {
            user1_id: recipient_id,
            user2_id: req.user.id,
          },
        ],
      },
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    const conversation = await prisma.conversation.create({
      data: {
        user1_id: req.user.id,
        user2_id: recipient_id,
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    logger.error('Create conversation error:', error);
    throw error;
  }
};

// Send message
export const sendMessage = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  const files = req.files as Express.Multer.File[];

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: {
            id: true,
            email: true,
            full_name: true,
            notification_settings: true,
          },
        },
        user2: {
          select: {
            id: true,
            email: true,
            full_name: true,
            notification_settings: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found');
    }

    if (
      conversation.user1_id !== req.user.id &&
      conversation.user2_id !== req.user.id
    ) {
      throw new ApiError(403, 'You are not part of this conversation');
    }

    // Upload attachments if any
    const attachments = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = `messages/${conversationId}/${Date.now()}-${file.originalname}`;
        const fileUrl = await uploadFile(filePath, file.buffer);
        attachments.push({
          url: fileUrl,
          type: file.mimetype,
          name: file.originalname,
          size: file.size,
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: req.user.id,
        content,
        attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    // Send real-time update
    io.to(conversationId).emit('new_message', message);

    // Send notifications
    const recipient =
      conversation.user1_id === req.user.id
        ? conversation.user2
        : conversation.user1;

    if (recipient.notification_settings?.push_notifications) {
      await sendNotification({
        user_id: recipient.id,
        title: 'New Message',
        message: `${req.user.full_name}: ${content}`,
        type: 'message',
        data: { conversation_id: conversationId },
      });
    }

    if (recipient.notification_settings?.email_notifications) {
      await sendEmail({
        to: recipient.email,
        subject: 'New Message',
        template: 'new-message',
        context: {
          recipient_name: recipient.full_name,
          sender_name: req.user.full_name,
          message_preview: content.substring(0, 100),
          conversation_url: `${process.env.CLIENT_URL}/messages/${conversationId}`,
        },
      });
    }

    res.status(201).json(message);
  } catch (error) {
    logger.error('Send message error:', error);
    throw error;
  }
};

// Mark messages as read
export const markAsRead = async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  try {
    await prisma.message.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: req.user.id },
        read_at: null,
      },
      data: { read_at: new Date() },
    });

    // Send real-time update
    io.to(conversationId).emit('messages_read', {
      conversation_id: conversationId,
      user_id: req.user.id,
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    logger.error('Mark as read error:', error);
    throw error;
  }
};

// Delete message
export const deleteMessage = async (req: Request, res: Response) => {
  const { conversationId, messageId } = req.params;

  try {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation_id: conversationId,
      },
    });

    if (!message) {
      throw new ApiError(404, 'Message not found');
    }

    if (message.sender_id !== req.user.id) {
      throw new ApiError(403, 'You can only delete your own messages');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    // Send real-time update
    io.to(conversationId).emit('message_deleted', {
      conversation_id: conversationId,
      message_id: messageId,
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    logger.error('Delete message error:', error);
    throw error;
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { user1_id: req.user.id },
            { user2_id: req.user.id },
          ],
        },
        sender_id: { not: req.user.id },
        read_at: null,
      },
    });

    res.json({ unread_count: unreadCount });
  } catch (error) {
    logger.error('Get unread count error:', error);
    throw error;
  }
};

// Search messages
export const searchMessages = async (req: Request, res: Response) => {
  const { query } = req.body;
  const { page = 1, limit = 20 } = req.query;

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          OR: [
            { user1_id: req.user.id },
            { user2_id: req.user.id },
          ],
        },
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        conversation: {
          include: {
            user1: {
              select: {
                id: true,
                username: true,
                full_name: true,
                avatar_url: true,
              },
            },
            user2: {
              select: {
                id: true,
                username: true,
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.message.count({
      where: {
        conversation: {
          OR: [
            { user1_id: req.user.id },
            { user2_id: req.user.id },
          ],
        },
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
    });

    res.json({
      messages,
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    logger.error('Search messages error:', error);
    throw error;
  }
};

// Block user
export const blockUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const blockedUser = await prisma.blockedUser.create({
      data: {
        blocker_id: req.user.id,
        blocked_id: userId,
      },
    });

    res.status(201).json(blockedUser);
  } catch (error) {
    logger.error('Block user error:', error);
    throw error;
  }
};

// Unblock user
export const unblockUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    await prisma.blockedUser.delete({
      where: {
        blocker_id_blocked_id: {
          blocker_id: req.user.id,
          blocked_id: userId,
        },
      },
    });

    res.json({ message: 'User unblocked' });
  } catch (error) {
    logger.error('Unblock user error:', error);
    throw error;
  }
};

// Report message
export const reportMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { reason, details } = req.body;

  try {
    const report = await prisma.messageReport.create({
      data: {
        message_id: messageId,
        reporter_id: req.user.id,
        reason,
        details,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
    });

    await Promise.all(
      admins.map((admin) =>
        sendNotification({
          user_id: admin.id,
          title: 'New Message Report',
          message: `A message has been reported. Reason: ${reason}`,
          type: 'report',
          data: { report_id: report.id },
        })
      )
    );

    res.status(201).json(report);
  } catch (error) {
    logger.error('Report message error:', error);
    throw error;
  }
};

// Get blocked users
export const getBlockedUsers = async (req: Request, res: Response) => {
  try {
    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blocker_id: req.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    res.json(blockedUsers.map((b) => b.blocked));
  } catch (error) {
    logger.error('Get blocked users error:', error);
    throw error;
  }
};