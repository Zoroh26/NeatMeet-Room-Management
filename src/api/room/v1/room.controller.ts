import { Request, Response } from 'express';
import { RoomService } from './room.service';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const { start_time, end_time, available_only } = req.query;
    
    // Convert query parameters
    const startTime = start_time as string;
    const endTime = end_time as string;
    const filterAvailable = available_only === 'true';

    const rooms = await RoomService.getActiveRooms(startTime, endTime, filterAvailable);
    
    let message = 'Rooms retrieved successfully';
    if (startTime && endTime) {
      message = `Room availability checked for ${startTime} to ${endTime}`;
    } else if (filterAvailable) {
      message = 'Available rooms retrieved successfully';
    }

    res.status(200).json({
      success: true,
      message,
      count: rooms.length,
      filters: {
        start_time: startTime || null,
        end_time: endTime || null,
        available_only: filterAvailable
      },
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

// NEW: Check room availability endpoint
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { start_time, end_time } = req.query;

    // Validate required parameters
    if (!start_time || !end_time) {
      return res.status(400).json({
        success: false,
        code: "MISSING_PARAMETERS",
        message: "start_time and end_time are required parameters"
      });
    }

    // Validate date format
    const startDate = new Date(start_time as string);
    const endDate = new Date(end_time as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        code: "INVALID_DATE_FORMAT",
        message: "start_time and end_time must be valid ISO date strings"
      });
    }

    // Validate time logic
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        code: "INVALID_TIME_RANGE",
        message: "start_time must be before end_time"
      });
    }

    // Check if time is in the past
    const now = new Date();
    if (startDate < now) {
      return res.status(400).json({
        success: false,
        code: "PAST_TIME",
        message: "Cannot check availability for past time"
      });
    }

    console.log(`🔍 Checking room availability from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const availableRooms = await RoomService.getAvailableRooms(startDate, endDate);

    res.status(200).json({
      success: true,
      message: `Found ${availableRooms.length} available rooms for the requested time slot`,
      timeSlot: {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
      },
      totalAvailable: availableRooms.length,
      data: availableRooms
    });

  } catch (error: any) {
    console.error("Check availability error:", error);
    res.status(500).json({
      success: false,
      code: "AVAILABILITY_CHECK_ERROR",
      message: "Error checking room availability",
      error: error.message
    });
  }
};
