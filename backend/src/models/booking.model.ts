import mongoose, { Document, Schema } from 'mongoose';

interface IBooking extends mongoose.Document {
  room_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  start_time: Date;
  end_time: Date;
  purpose: string;
  status: 'in progress' | 'scheduled' | 'cancelled';
}

const bookingSchema = new Schema<IBooking>({
  room_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true 
  },
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  start_time: { 
    type: Date, 
    required: true
  },
  end_time: { 
    type: Date, 
    required: true
  },
  purpose: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: [200, 'Purpose cannot exceed 200 characters']
  },
  status: { 
    type: String, 
    enum: {
      values: ['in progress', 'scheduled', 'cancelled'],
      message: 'Status must be either in progress, scheduled, or cancelled'
    }, 
    required: true, 
    default: 'scheduled' 
  }
}, { 
  timestamps: true,
  versionKey: '__v', 
  optimisticConcurrency: true,
  toJSON: {
    transform: function(doc, ret) {
      // Ensure dates are returned as ISO strings without timezone conversion
      if (ret.start_time) {
        ret.start_time = ret.start_time.toISOString();
      }
      if (ret.end_time) {
        ret.end_time = ret.end_time.toISOString();
      }
      if (ret.createdAt) {
        ret.createdAt = ret.createdAt.toISOString();
      }
      if (ret.updatedAt) {
        ret.updatedAt = ret.updatedAt.toISOString();
      }
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      // Ensure dates are returned as ISO strings without timezone conversion
      if (ret.start_time) {
        ret.start_time = ret.start_time.toISOString();
      }
      if (ret.end_time) {
        ret.end_time = ret.end_time.toISOString();
      }
      if (ret.createdAt) {
        ret.createdAt = ret.createdAt.toISOString();
      }
      if (ret.updatedAt) {
        ret.updatedAt = ret.updatedAt.toISOString();
      }
      return ret;
    }
  }
});

// Index for efficient queries
bookingSchema.index({ room_id: 1, start_time: 1, end_time: 1 });
bookingSchema.index({ user_id: 1 });

// Add compound unique index to prevent exact duplicate bookings
bookingSchema.index({ 
  room_id: 1, 
  start_time: 1, 
  end_time: 1, 
  user_id: 1 
}, { 
  unique: true,
  name: 'unique_booking_constraint'
});

module.exports = mongoose.model<IBooking>('Booking', bookingSchema, 'booking');
