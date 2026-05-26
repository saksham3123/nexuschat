const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content:    { type: String, required: true, maxlength: 2000 },
    sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room:       { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    type:       { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
    readBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions:  [{ emoji: String, users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
  },
  { timestamps: true }
);

// Compound index for fast paginated message history queries
messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
