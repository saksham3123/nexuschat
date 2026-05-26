const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type:        { type: String, enum: ['group', 'direct'], default: 'group' },
    members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

roomSchema.index({ members: 1 });

module.exports = mongoose.model('Room', roomSchema);
