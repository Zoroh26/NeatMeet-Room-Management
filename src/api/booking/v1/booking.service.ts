import mongoose from "mongoose";
const Booking = require("../../../models/booking.model");
const Room = require("../../../models/room.model");
const User = require("../../../models/user.model");

interface CreateBookingData{
    room_id:string;
    user_id:string;
    start_time:Date;
    end_time:Date;
    purpose:String;
}

class BookingService{

    async countBookings(filters:any={}):Promise<number>{
        const query = this.buildQuery(filters);
        return await Booking.countDocuments(query)
    }

    // NEW: Add the missing getBookingsPaginated method
    async getBookingsPaginated(filters: any = {}, options: any = {}) {
        const query = this.buildQuery(filters);

        let mongoQuery = Booking.find(query);

        // Apply pagination
        if (options.skip) {
            mongoQuery = mongoQuery.skip(options.skip);
        }
        if (options.limit) {
            mongoQuery = mongoQuery.limit(options.limit);
        }

        // Apply sorting
        if (options.sort) {
            mongoQuery = mongoQuery.sort(options.sort);
        }

        // Populate related data
        mongoQuery = mongoQuery
            .populate('room_id', 'name capacity location description')
            .populate('user_id', 'name email designation');

        return await mongoQuery.exec();
    }

    // NEW: Add the missing buildQuery method
    private buildQuery(filters: any = {}) {
        const query: any = {};

        // Filter by user (employee)
        if (filters.user_id) {
            query.user_id = new mongoose.Types.ObjectId(filters.user_id);
        }

        // Filter by room
        if (filters.room_id) {
            query.room_id = new mongoose.Types.ObjectId(filters.room_id);
        }

        // Filter by status
        if (filters.status) {
            query.status = filters.status;
        }

        // Filter by date (bookings that occur on this date)
        if (filters.date) {
            const targetDate = new Date(filters.date);
            if (!isNaN(targetDate.getTime())) {
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);

                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);

                query.$or = [
                    // Booking starts on this day
                    { start_time: { $gte: startOfDay, $lte: endOfDay } },
                    // Booking ends on this day
                    { end_time: { $gte: startOfDay, $lte: endOfDay } },
                    // Booking spans across this day
                    { start_time: { $lte: startOfDay }, end_time: { $gte: endOfDay } }
                ];
            }
        }

        return query;
    }

    async validateEntities(room_id:string,user_id:string){
        const [room,user]=await Promise.all([
            Room.findOne({_id: room_id, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]}),
            User.findOne({_id: user_id, isDeleted: false})
        ])

        if(!room){
            throw new Error("Room not found or does not exists");
        }
        if(!user){
            throw new Error("User not found or does not exists");
        }
        return{room,user};
    }

    async checkRoomAvailability(room_id:string,start_time:Date,end_time:Date,excludeBookingId?:string, session?: any){
        const query:any={
            room_id:new mongoose.Types.ObjectId(room_id),
            status:{$in :['scheduled','in progress']},
            $or:[
                // New booking starts before existing ends AND new booking ends after existing starts
                {
                    start_time: { $lt: end_time },
                    end_time: { $gt: start_time }
                }
            ]
        }
        if(excludeBookingId){
            query._id={$ne:excludeBookingId}
        }
        
        const findQuery = Booking.findOne(query).populate('user_id','name email');
        if (session) {
            findQuery.session(session);
        }
        return await findQuery;
    }

    async createBookingWithTransaction(bookingData: CreateBookingData) {
        const session = await mongoose.startSession();
        try {
            let bookingResult;
            
            await session.withTransaction(async () => {
                const { room_id, user_id, start_time, end_time, purpose } = bookingData;
                const startDate = new Date(start_time);
                const endDate = new Date(end_time);
                const now = new Date();

                if (startDate >= endDate) {
                    throw new Error("Start time must be before end time");
                }
                if (startDate < now) {
                    throw new Error("Cannot create booking for past time");
                }

                await this.validateEntities(room_id, user_id);

                // Use session in conflict check - CRITICAL for preventing race conditions
                const conflict = await this.checkRoomAvailability(room_id, startDate, endDate, undefined, session);
                if (conflict) {
                    const bookedBy = conflict.user_id?.name || "Unknown User";
                    const startTime = new Date(conflict.start_time).toISOString();
                    const endTime = new Date(conflict.end_time).toISOString();
                    throw new Error(
                        `Room is already booked from ${startTime} ` +
                        `to ${endTime} by ${bookedBy}. Please choose a different time slot.`
                    );
                }

                const status = startDate <= now && endDate > now ? 'in progress' : 'scheduled';

                // All operations within session
                const newBooking = new Booking({
                    room_id: new mongoose.Types.ObjectId(room_id),
                    user_id: new mongoose.Types.ObjectId(user_id),
                    start_time: startDate,
                    end_time: endDate,
                    purpose: purpose.trim(),
                    status,
                });

                await newBooking.save({ session });

                bookingResult = await Booking.findById(newBooking._id)
                    .populate('room_id', 'name capacity location')
                    .populate('user_id', 'name email designation')
                    .session(session);
            });
            
            return bookingResult;
        } finally {
            await session.endSession();
        }
    }

    // UPDATED: Enhanced getBookings method (keeping your original logic but using buildQuery)
    async getBookings(filters:any={}){
        const query = this.buildQuery(filters);
        
        return await Booking.find(query)
            .populate('room_id','name capacity location')
            .populate('user_id','name email designation')
            .sort({start_time:1})
    }

    async updateBookingWithTransaction(bookingId: string, updateData: any, requestingUserId: string) {
        const session = await mongoose.startSession();
        try {
            let updateResult;
            
            await session.withTransaction(async () => {
                // Find the existing booking
                const existingBooking = await Booking.findById(bookingId).session(session);
                
                if (!existingBooking) {
                    throw new Error("Booking not found");
                }

                // Authorization check - only the booking owner or admin can update
                if (existingBooking.user_id.toString() !== requestingUserId) {
                    // Check if requesting user is admin (this would need user role check)
                    // For now, throw error - you can enhance this with role-based auth
                    throw new Error("You can only update your own bookings");
                }

                // Check if booking can be updated (not in the past or currently in progress)
                const now = new Date();
                if (existingBooking.start_time <= now) {
                    throw new Error("Cannot update booking that has already started or is in progress");
                }

                // Validate update data
                const { start_time, end_time, purpose, status } = updateData;
                
                let updatedStartTime = existingBooking.start_time;
                let updatedEndTime = existingBooking.end_time;

                if (start_time || end_time) {
                    updatedStartTime = start_time ? new Date(start_time) : existingBooking.start_time;
                    updatedEndTime = end_time ? new Date(end_time) : existingBooking.end_time;

                    // Validate time logic
                    if (updatedStartTime >= updatedEndTime) {
                        throw new Error("Start time must be before end time");
                    }

                    if (updatedStartTime < now) {
                        throw new Error("Cannot schedule booking for past time");
                    }

                    // Check for conflicts with other bookings (excluding current booking)
                    const conflict = await this.checkRoomAvailability(
                        existingBooking.room_id.toString(), 
                        updatedStartTime, 
                        updatedEndTime, 
                        bookingId,
                        session
                    );

                    if (conflict) {
                        const bookedBy = conflict.user_id?.name || "Unknown User";
                        const startTime = new Date(conflict.start_time).toISOString();
                        const endTime = new Date(conflict.end_time).toISOString();
                        throw new Error(
                            `Updated time conflicts with existing booking from ${startTime} ` +
                            `to ${endTime} by ${bookedBy}`
                        );
                    }
                }

                // Prepare update object
                const updateObject: any = {};
                
                if (start_time) updateObject.start_time = updatedStartTime;
                if (end_time) updateObject.end_time = updatedEndTime;
                if (purpose) updateObject.purpose = purpose.trim();
                if (status && ['scheduled', 'cancelled'].includes(status)) {
                    updateObject.status = status;
                }

                // Update the booking
                const updatedBooking = await Booking.findByIdAndUpdate(
                    bookingId,
                    updateObject,
                    { new: true, session, runValidators: true }
                );

                updateResult = await Booking.findById(updatedBooking._id)
                    .populate('room_id', 'name capacity location')
                    .populate('user_id', 'name email designation')
                    .session(session);
            });
            
            return updateResult;
        } finally {
            await session.endSession();
        }
    }

    async getBookingById(bookingId: string) {
        const booking = await Booking.findById(bookingId)
            .populate('room_id', 'name capacity location')
            .populate('user_id', 'name email designation');
        
        if (!booking) {
            throw new Error("Booking not found");
        }
        
        return booking;
    }

    async cancelBooking(bookingId: string, requestingUserId: string) {
        const session = await mongoose.startSession();
        
        try {
            let cancelResult;
            
            await session.withTransaction(async () => {
                const booking = await Booking.findById(bookingId).session(session);
                
                if (!booking) {
                    throw new Error("Booking not found");
                }

                // Authorization check
                if (booking.user_id.toString() !== requestingUserId) {
                    throw new Error("You can only cancel your own bookings");
                }

                // Check if booking can be cancelled
                const now = new Date();
                if (booking.start_time <= now) {
                    throw new Error("Cannot cancel booking that has already started or is in progress");
                }

                if (booking.status === 'cancelled') {
                    throw new Error("Booking is already cancelled");
                }

                // Cancel the booking
                const updatedBooking = await Booking.findByIdAndUpdate(
                    bookingId,
                    { status: 'cancelled' },
                    { new: true, runValidators: true, session }
                );

                cancelResult = await Booking.findById(updatedBooking._id)
                    .populate('room_id', 'name capacity location')
                    .populate('user_id', 'name email designation')
                    .session(session);
            });
            
            return cancelResult;
        } finally {
            await session.endSession();
        }
    }
}

export const bookingService = new BookingService();
