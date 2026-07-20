import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    boardId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Board',
      required: true,
      index:    true,
    },

    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    type: {
      type:    String,
      enum:    ['text', 'image', 'system'],
      default: 'text',
    },

    content: {
      type:    String,
      trim:    true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      required: function () {
        return this.type !== 'image';
      },
    },

    imageUrl: {
      type:    String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ boardId: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
