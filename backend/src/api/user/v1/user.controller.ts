import { Request, Response } from 'express';
import { UserService } from './user.service';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserService.getActiveUsers();
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      count: users.length,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json({
      success: true,
      message: 'All users retrieved successfully',
      count: users.length,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

export const getDeletedUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserService.getDeletedUsers();
    res.status(200).json({
      success: true,
      message: 'Deleted users retrieved successfully',
      count: users.length,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving deleted users',
      error: error.message
    });
  }
};

// GET - Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await UserService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or has been deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: error.message
    });
  }
};


// POST - Create a new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, designation } = req.body;
    const adminUserId = (req as any).user?.userId;

    if (!name || !email || !password || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and designation are required'
      });
    }

    const userData = await UserService.createUser({
      name,
      email,
      password,
      role: role || 'employee',
      designation
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: userData,
        createdBy: adminUserId
      }
    });
  } catch (error: any) {
    let statusCode = 500;
    if (error.message.includes('already exists')) statusCode = 409;
    if (error.message.includes('Only administrators')) statusCode = 403;
    
    res.status(statusCode).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};



export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const updatedUser = await UserService.updateUser(userId, updateData);

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser
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
      message: "Error updating user",
      error: error.message
    });
  }
};


export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await UserService.softDeleteUser(userId);

    res.status(200).json({
      success: true,
      message: 'User soft deleted successfully',
      data: result
    });

  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: "Error deleting user",
      error: error.message
    });
  }
};

export const hardDeleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await UserService.hardDeleteUser(userId);

    res.status(200).json({
      success: true,
      message: 'User permanently deleted',
      data: result
    });

  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: "Error permanently deleting user",
      error: error.message
    });
  }
};

export const restoreUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const restoredUser = await UserService.restoreUser(userId);

    res.status(200).json({
      success: true,
      message: "User restored successfully",
      data: restoredUser
    });

  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: "Error restoring user",
      error: error.message
    });
  }
};