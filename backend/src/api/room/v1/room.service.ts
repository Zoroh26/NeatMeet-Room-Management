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

    // If no time filter specified, return rooms with current availability
    if (!startTime || !endTime) {
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

    // Check availability for specific time period
    const roomsWithTimeBasedAvailability = await Promise.all(
      rooms.map(async (room: any) => {
        const isAvailableForPeriod = await this.isRoomAvailableForPeriod(
          room._id, 
          new Date(startTime), 
          new Date(endTime)
        );
        
        return {
          ...room.toObject(),
          isAvailableForPeriod,
          requestedTimeSlot: {
            start: startTime,
            end: endTime
          },
          dynamicStatus: !isAvailableForPeriod ? 'occupied' : room.status === 'available' ? 'available' : room.status
        };
      })
    );

    return filterAvailable 
      ? roomsWithTimeBasedAvailability.filter(room => room.isAvailableForPeriod && room.status === 'available')
      : roomsWithTimeBasedAvailability;
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

  /**
   * Check if room is available for a specific time period
   */
  static async isRoomAvailableForPeriod(roomId: string, startTime: Date, endTime: Date): Promise<boolean> {
    // Check if room itself is available (not in maintenance, etc.)
    const room = await Room.findById(roomId);
    if (!room || room.status !== 'available') {
      return false;
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      room_id: roomId,
      status: { $in: ['scheduled', 'confirmed'] },
      $or: [
        // Booking starts during the requested period
        {
          start_time: { $gte: startTime, $lt: endTime }
        },
        // Booking ends during the requested period
        {
          end_time: { $gt: startTime, $lte: endTime }
        },
        // Booking completely encompasses the requested period
        {
          start_time: { $lte: startTime },
          end_time: { $gte: endTime }
        },
        // Requested period completely encompasses the booking
        {
          start_time: { $gte: startTime },
          end_time: { $lte: endTime }
        }
      ]
    });

    return !overlappingBooking;
  }

  /**
   * Get room's booking schedule for a specific date or date range
   */
  static async getRoomSchedule(roomId: string, date?: string, startDate?: string, endDate?: string): Promise<any> {
    let dateFilter: any = {};

    if (date) {
      // Single date
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      dateFilter = {
        $or: [
          { start_time: { $gte: startOfDay, $lte: endOfDay } },
          { end_time: { $gte: startOfDay, $lte: endOfDay } },
          { 
            start_time: { $lte: startOfDay },
            end_time: { $gte: endOfDay }
          }
        ]
      };
    } else if (startDate && endDate) {
      // Date range
      dateFilter = {
        $or: [
          { start_time: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { end_time: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { 
            start_time: { $lte: new Date(startDate) },
            end_time: { $gte: new Date(endDate) }
          }
        ]
      };
    } else {
      // Default to next 7 days
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      dateFilter = {
        start_time: { $gte: now, $lte: nextWeek }
      };
    }

    const bookings = await Booking.find({
      room_id: roomId,
      status: { $in: ['scheduled', 'confirmed'] },
      ...dateFilter
    })
    .populate('user_id', 'name email')
    .sort({ start_time: 1 });

    return bookings;
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

  static async hardDeleteRoom(roomId: string): Promise<{
    deletedRoomId: string;
    deletedRoomName: string;
  }> {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    await Room.findByIdAndDelete(roomId);

    return {
      deletedRoomId: roomId,
      deletedRoomName: room.name
    };
  }

  static async restoreRoom(roomId: string): Promise<any> {
    const room = await Room.findOne({
      _id: roomId,
      isDeleted: true
    });

    if (!room) {
      throw new Error('Deleted room not found');
    }

    const restoredRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        isDeleted: false,
        deletedAt: null
      },
      { new: true }
    );

    return restoredRoom;
  }

  static async getAvailableRooms(): Promise<any[]> {
    return await Room.find({
      status: 'available',
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
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
