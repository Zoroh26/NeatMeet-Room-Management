const User = require('../../../models/user.model');

export class UserService {
  // GET active users
  static async getActiveUsers(): Promise<any[]> {
    return await User.find({
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    }).select('-password');
  }

// GET all users  
  static async getAllUsers(): Promise<any[]> {
    return await User.find().select('-password');
  }

  // GET deleted users
  static async getDeletedUsers(): Promise<any[]> {
    return await User.find({ isDeleted: true }).select('-password');
  }

  // GET user by ID
  static async getUserById(userId: string): Promise<any | null> {
    return await User.findOne({
      _id: userId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    }).select('-password');
  }


//Create user
  static async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    designation: string;
  }): Promise<any> {
    const { name, email, password, role, designation } = userData;

   
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.isDeleted) {
        throw new Error('User with this email was previously deleted. Please restore the user or use a different email.');
      }
      throw new Error('User with this email already exists');
    }

    
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
      designation,
      isDeleted: false,
      deletedAt: null
    });

    await newUser.save();

    
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return userResponse;
  }

  // Update user
  static async updateUser(userId: string, updateData: any): Promise<any> {
    
    const existingUser = await User.findOne({
      _id: userId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!existingUser) {
      throw new Error('User not found or has been deleted');
    }

    
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await User.findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (emailExists && !emailExists.isDeleted) {
        throw new Error('Email already exists');
      }
    }

    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
        omitUndefined: true
      }
    ).select('-password');

    return updatedUser;
  }

  // Soft delete user
  static async softDeleteUser(userId: string): Promise<{
    deletedUserId: string;
    deletedUserEmail: string;
    deletedAt: Date;
  }> {
    
    const user = await User.findOne({
      _id: userId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!user) {
      throw new Error('User not found or already deleted');
    }

    
    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date()
    });

    return {
      deletedUserId: userId,
      deletedUserEmail: user.email,
      deletedAt: new Date()
    };
  }

  // Hard delete user
  static async hardDeleteUser(userId: string): Promise<{
    deletedUserId: string;
    deletedUserEmail: string;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await User.findByIdAndDelete(userId);

    return {
      deletedUserId: userId,
      deletedUserEmail: user.email
    };
  }

  // Restore user
  static async restoreUser(userId: string): Promise<any> {
    const user = await User.findOne({
      _id: userId,
      isDeleted: true
    });

    if (!user) {
      throw new Error('Deleted user not found');
    }

    const restoredUser = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: false,
        deletedAt: null
      },
      { new: true }
    ).select('-password');

    return restoredUser;
  }
}
