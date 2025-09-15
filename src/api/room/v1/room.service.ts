const Room = require('../../../models/room.model');
const Booking = require('../../../models/booking.model');

export class RoomService {
  static async getActiveRooms(startTime?: string, endTime?: string, filterAvailable?: boolean): Promise<any[]> {
    const rooms = await Room.find({
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    // Return rooms with current availability (ignoring time filters for simplicity)
    const roomsWithAvailability = await Promise.all(
      rooms.map(async (room: any) => {
        const isCurrentlyBooked = await this.isRoomCurrentlyBooked(room._id);
        return {
          ...room.toObject(),
          isCurrentlyAvailable: !isCurrentlyBooked,
          dynamicStatus: isCurrentlyBooked ? 'occupied' : room.status === 'available' ? 'available' : room.status
        };
      })
    );

    return filterAvailable 
      ? roomsWithAvailability.filter(room => room.isCurrentlyAvailable && room.status === 'available')
      : roomsWithAvailability;
  }

  /**
   * Check if room is currently booked (right now)
   */
  static async isRoomCurrentlyBooked(roomId: string): Promise<boolean> {
    const now = new Date();
    
    const activeBooking = await Booking.findOne({
      room_id: roomId,
      status: { $in: ['scheduled', 'confirmed'] },
      start_time: { $lte: now },
      end_time: { $gte: now }
    });

    return !!activeBooking;
  }

  static async getAllRooms(): Promise<any[]> {
    return await Room.find();
  }

  static async getDeletedRooms(): Promise<any[]> {
    return await Room.find({ isDeleted: true });
  }

  static async getRoomById(roomId: string): Promise<any | null> {
    return await Room.findOne({
      _id: roomId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
  }

  static async createRoom(roomData: {
    name: string;
    location: string;
    capacity: number;
    amenities: string[];
    status?: string;
    description?: string;
  }): Promise<any> {
    const { name, location, capacity, amenities, status, description } = roomData;

    console.log('🏠 Creating room with data:', JSON.stringify(roomData, null, 2));

    const existingRoom = await Room.findOne({ 
      name: name.trim(),
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
    
    if (existingRoom) {
      throw new Error('Room with this name already exists');
    }

    const newRoomData = {
      name: name.trim(),
      location: location.trim(),
      capacity,
      amenities: amenities.map(amenity => amenity.trim()),
      status: status || 'available',
      description: description?.trim(),
      isDeleted: false,
      deletedAt: null
    };

    console.log('🏠 Processed room data:', JSON.stringify(newRoomData, null, 2));

    const newRoom = new Room(newRoomData);
    
    console.log('🏠 Room instance created, validating...');
    
    try {
      await newRoom.validate();
      console.log('✅ Room validation passed');
    } catch (validationError: any) {
      console.error('❌ Room validation failed:', validationError);
      console.error('❌ Validation errors:', validationError.errors);
      throw validationError;
    }

    console.log('🏠 Saving room...');
    await newRoom.save();
    console.log('✅ Room saved successfully');
    
    return newRoom;
  }

  static async updateRoom(roomId: string, updateData: any): Promise<any> {
    const existingRoom = await Room.findOne({
      _id: roomId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!existingRoom) {
      throw new Error('Room not found or has been deleted');
    }

    if (updateData.name && updateData.name !== existingRoom.name) {
      const nameExists = await Room.findOne({
        name: updateData.name.trim(),
        _id: { $ne: roomId },
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ]
      });

      if (nameExists) {
        throw new Error('Room name already exists');
      }
    }

    const cleanUpdateData = { ...updateData };
    if (cleanUpdateData.name) cleanUpdateData.name = cleanUpdateData.name.trim();
    if (cleanUpdateData.location) cleanUpdateData.location = cleanUpdateData.location.trim();
    if (cleanUpdateData.description) cleanUpdateData.description = cleanUpdateData.description.trim();
    if (cleanUpdateData.amenities) {
      cleanUpdateData.amenities = cleanUpdateData.amenities.map((amenity: string) => amenity.trim());
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      cleanUpdateData,
      {
        new: true,
        runValidators: true,
        omitUndefined: true
      }
    );

    return updatedRoom;
  }

  static async softDeleteRoom(roomId: string): Promise<{
    deletedRoomId: string;
    deletedRoomName: string;
    deletedAt: Date;
  }> {
    const room = await Room.findOne({
      _id: roomId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!room) {
      throw new Error('Room not found or already deleted');
    }

    await Room.findByIdAndUpdate(roomId, {
      isDeleted: true,
      deletedAt: new Date()
    });

    return {
      deletedRoomId: roomId,
      deletedRoomName: room.name,
      deletedAt: new Date()
    };
  }

  
  static async getAvailableRooms(startTime?: Date, endTime?: Date): Promise<any[]> {
    try {
      // Get all active (non-deleted) rooms that are marked as available
      const allRooms = await Room.find({
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ],
        status: 'available' // Only check rooms that are marked as available
      });

      // If no time range provided, return all available rooms
      if (!startTime || !endTime) {
        return allRooms.map((room: any) => ({
          _id: room._id,
          name: room.name,
          location: room.location,
          capacity: room.capacity,
          description: room.description,
          amenities: room.amenities,
          status: room.status,
          isAvailable: true
        }));
      }

      // Check each room for conflicts during the requested time
      const availableRooms = await Promise.all(
        allRooms.map(async (room: any) => {
          const hasConflict = await this.hasBookingConflict(room._id, startTime, endTime);
          
          if (!hasConflict) {
            return {
              _id: room._id,
              name: room.name,
              location: room.location,
              capacity: room.capacity,
              description: room.description,
              amenities: room.amenities,
              status: room.status,
              isAvailable: true,
              availableFor: {
                start_time: startTime,
                end_time: endTime,
                duration_minutes: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
              }
            };
          }
          return null;
        })
      );

      // Filter out null values (rooms with conflicts)
      return availableRooms.filter(room => room !== null);

    } catch (error) {
      console.error("Error checking room availability:", error);
      throw error;
    }
  }

  // Helper method to check if a room has booking conflicts
  private static async hasBookingConflict(roomId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const conflictingBooking = await Booking.findOne({
      room_id: roomId,
      status: { $in: ['scheduled', 'in progress', 'confirmed'] },
      $or: [
        // New booking starts before existing ends AND new booking ends after existing starts
        {
          start_time: { $lt: endTime },
          end_time: { $gt: startTime }
        }
      ]
    });

    return !!conflictingBooking;
  }

  static async updateRoomStatus(roomId: string, status: string): Promise<any> {
    const validStatuses = ['available', 'occupied', 'maintenance', 'out-of-service'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be one of: available, occupied, maintenance, out-of-service');
    }

    const room = await Room.findOne({
      _id: roomId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!room) {
      throw new Error('Room not found or has been deleted');
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { status },
      { new: true }
    );

    return updatedRoom;
  }
}
