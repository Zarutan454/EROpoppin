import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { validateRequest } from '../middleware/validateRequest';
import {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  blockUser,
  unblockUser,
  reportMessage,
  getBlockedUsers,
} from '../controllers/messages';

const router = Router();

// Multer configuration for file attachments
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  },
});

// Message validation
const messageValidation = [
  body('content')
    .if(body('attachments').isEmpty())
    .isString()
    .notEmpty()
    .withMessage('Message content is required if no attachments')
    .trim(),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
];

// Report validation
const reportValidation = [
  body('reason')
    .isString()
    .notEmpty()
    .withMessage('Report reason is required')
    .isLength({ max: 500 })
    .withMessage('Report reason cannot exceed 500 characters')
    .trim(),
  body('details')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Report details cannot exceed 1000 characters')
    .trim(),
];

// Routes

// Conversations
router.get('/', getConversations);
router.get('/:conversationId', getConversation);
router.post('/new', 
  body('recipient_id').isUUID().withMessage('Invalid recipient ID'),
  validateRequest,
  createConversation
);

// Messages
router.post(
  '/:conversationId/messages',
  upload.array('files', 5), // Max 5 files per message
  messageValidation,
  validateRequest,
  sendMessage
);
router.post('/:conversationId/read', markAsRead);
router.delete('/:conversationId/messages/:messageId', deleteMessage);
router.get('/unread/count', getUnreadCount);
router.get('/search', 
  body('query')
    .isString()
    .notEmpty()
    .withMessage('Search query is required')
    .trim(),
  validateRequest,
  searchMessages
);

// User management
router.post('/block/:userId', blockUser);
router.post('/unblock/:userId', unblockUser);
router.get('/blocked', getBlockedUsers);

// Reporting
router.post(
  '/report/:messageId',
  reportValidation,
  validateRequest,
  reportMessage
);

export { router as messageRouter };