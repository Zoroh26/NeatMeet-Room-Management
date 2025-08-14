import { Request, Response } from 'express';
import { RoomService } from './room.service';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await RoomService.getActiveRooms();
    res.status(200).json({
      success: true,
      message: 'Rooms retrieved successfully',
      count: rooms.length,
      data: rooms
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving rooms',
      error: error.message
    });
  }
};

export const getAllRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await RoomService.getAllRooms();
    res.status(200).json({
      success: true,
      message: 'All rooms retrieved successfully',
      count: rooms.length,
      data: rooms
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving rooms',
      error: error.message
    });
  }
};

export const getDeletedRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await RoomService.getDeletedRooms();
    res.status(200).json({
      success: true,
      message: 'Deleted rooms retrieved successfully',
      count: rooms.length,
      data: rooms
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving deleted rooms',
      error: error.message
    });
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const room = await RoomService.getRoomById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or has been deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room retrieved successfully',
      data: room
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving room',
      error: error.message
    });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, location, capacity, amenities, status, description } = req.body;

    const roomData = await RoomService.createRoom({
      name,
      location,
      capacity,
      amenities,
      status,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: roomData
    });
  } catch (error: any) {
    const statusCode = error.message.includes('already exists') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Error creating room',
      error: error.message
    });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;
    const updateData = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const updatedRoom = await RoomService.updateRoom(roomId, updateData);

    res.json({
      success: true,
      message: "Room updated successfully",
      data: updatedRoom
    });
    
  } catch (error: any) {
    let statusCode = 500;
    
    if (error.message.includes('not found') || error.message.includes('deleted')) {
      statusCode = 404;
    } else if (error.message.includes('already exists')) {
      statusCode = 400;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: "Error updating room",
      error: error.message
    });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const result = await RoomService.softDeleteRoom(roomId);

    res.status(200).json({
      success: true,
      message: 'Room soft deleted successfully',
      data: result
    });

  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: "Error deleting room",
      error: error.message
    });
  }
};

export const hardDeleteRoom = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const result = await RoomService.hardDeleteRoom(roomId);

    res.status(200).json({
      success: true,
      message: 'Room permanently deleted',
      data: result
    });

  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: "Error permanently deleting room",
      error: error.message
    });
  }
};

export const restoreRoom = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const restoredRoom = await RoomService.restoreRoom(roomId);

    res.status(200).json({
      success: true,
      message: "Room restored successfully",
      data: restoredRoom
    });

  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: "Error restoring room",
      error: error.message
    });
  }
};

export const getAvailableRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await RoomService.getAvailableRooms();
    res.status(200).json({
      success: true,
      message: 'Available rooms retrieved successfully',
      count: rooms.length,
      data: rooms
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving available rooms',
      error: error.message
    });
  }
};

export const updateRoomStatus = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;
    const { status } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updatedRoom = await RoomService.updateRoomStatus(roomId, status);

    res.status(200).json({
      success: true,
      message: `Room status updated to ${status}`,
      data: updatedRoom
    });

  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Invalid status') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: "Error updating room status",
      error: error.message
    });
  }
};
