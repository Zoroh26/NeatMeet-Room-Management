import mongoose, { Document, Schema } from 'mongoose';

interface IRoom extends mongoose.Document {
  name: string;
  location: string;
  capacity: number;
  amenities?: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-service';
  description?: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>({
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: [2, 'Room name must be at least 2 characters long'],
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  location: { 
    type: String, 
    required: true,
    trim: true,
    minlength: [2, 'Location must be at least 2 characters long'],
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  capacity: { 
    type: Number, 
    required: true,
    min: [1, 'Capacity must be at least 1'],
    max: [1000, 'Capacity cannot exceed 1000']
  },
  amenities: {
    type: [String],
    default: []
  },
  status: { 
    type: String, 
    enum: {
      values: ['available', 'occupied', 'maintenance', 'out-of-service'],
      message: 'Status must be one of: available, occupied, maintenance, out-of-service'
    },
    required: true,
    default: 'available'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

// Indexes for better performance
roomSchema.index({ isDeleted: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ capacity: 1 });
roomSchema.index({ name: 1 });

module.exports = mongoose.model<IRoom>('Room', roomSchema);
