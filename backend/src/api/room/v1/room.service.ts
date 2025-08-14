const Room = require('../../../models/room.model');

export class RoomService {
  static async getActiveRooms(): Promise<any[]> {
    return await Room.find({
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
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

    const newRoom = new Room({
      name: name.trim(),
      location: location.trim(),
      capacity,
      amenities: amenities.map(amenity => amenity.trim()),
      status: status || 'available',
      description: description?.trim(),
      isDeleted: false,
      deletedAt: null
    });

    await newRoom.save();
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
