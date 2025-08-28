import { Request, Response } from "express";
import { bookingService } from './booking.service'; // Fixed import path

export const createBooking = async (req: Request, res: Response) => {
    try {
        const { room_id, start_time, end_time, purpose } = req.body;
        // Extract user_id from JWT token payload for security
        const user_id = (req as any).user?.userId;

        // Validate required fields (user_id now comes from token)
        if (!room_id || !start_time || !end_time || !purpose) {
            return res.status(400).json({
                success: false,
                code: "MISSING_FIELDS",
                message: "All fields are required: room_id, start_time, end_time, purpose"
            });
        }

        // Validate user authentication
        if (!user_id) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "User authentication required"
            });
        }

        // Purpose validation
        if (purpose.trim().length === 0) {
            return res.status(400).json({
                success: false,
                code: "EMPTY_PURPOSE",
                message: "Purpose can't be empty"
            });
        }
        if (purpose.length > 200) {
            return res.status(400).json({
                success: false,
                code: "PURPOSE_TOO_LONG",
                message: "Purpose cannot exceed 200 characters"
            });
        }

        // Date parsing and validation
        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                code: "INVALID_DATE",
                message: "start_time and end_time must be valid date strings"
            });
        }

        // Delegate to the service (which uses transaction and conflict check)
        const booking = await bookingService.createBookingWithTransaction({
            room_id,
            user_id,
            start_time,
            end_time,
            purpose
        });

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking
        });

    } catch (error: any) {
        console.error("booking creation error:", error);

        // Entity not found
        if (error.message.includes('Room not found')) {
            return res.status(404).json({
                success: false,
                code: "ROOM_NOT_FOUND",
                message: error.message
            });
        }
        if (error.message.includes('User not found')) {
            return res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: error.message
            });
        }

        // Conflict/Overlap - FIXED: Changed 'error' to 'code'
        if (error.message.includes('already booked') || error.message.includes('conflict')) {
            return res.status(409).json({
                success: false,
                code: "BOOKING_CONFLICT", // Fixed: was 'error'
                message: error.message
            });
        }

        // Time-related bad requests
        if (error.message.includes('Start time must be before') || error.message.includes('past time')) {
            return res.status(400).json({
                success: false,
                code: "INVALID_TIME",
                message: error.message
            });
        }

        // Duplicate key error (could happen with a unique index)
        if (error.code && error.code === 11000) {
            return res.status(409).json({
                success: false,
                code: "DUPLICATE_BOOKING",
                message: "Duplicate booking detected"
            });
        }

        // Internal server error fallback
        return res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: 'Internal server error while creating booking'
        });
    }
};

// FIXED: Renamed from 'getBooking' to 'getBookings' for clarity
export const getBookings = async (req: Request, res: Response) => {
    try {
        const { employee, room, status, date, page = '1', limit = '10', sort = 'start_time', order = 'asc' } = req.query;

        // filters
        const filters: any = {};
        if (employee) filters.user_id = employee as string;
        if (room) filters.room_id = room as string;
        if (date) filters.date = date as string;
        if (status) filters.status = status as string;

        // pagination
        const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
        const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
        const skip = (pageNumber - 1) * pageLimit;

        // sorting
        const sortField = sort as string || 'start_time';
        const sortOrder = (order as string)?.toLowerCase() === 'desc' ? -1 : 1;
        const sortOptions = { [sortField]: sortOrder };

        // total count for pagination
        const total = await bookingService.countBookings(filters);

        // get paginated bookings
        const bookings = await bookingService.getBookingsPaginated(filters, {
            skip,
            limit: pageLimit,
            sort: sortOptions
        });

        // page info calculation
        const totalPages = Math.ceil(total / pageLimit);
        const hasNextPage = pageNumber < totalPages;
        const hasPrevPage = pageNumber > 1;

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: bookings,
            pagination: {
                current_page: pageNumber,
                total_pages: totalPages,
                total_count: total,
                count: bookings.length,
                limit: pageLimit,
                has_next_page: hasNextPage,
                has_prev_page: hasPrevPage,
                next_page: hasNextPage ? pageNumber + 1 : null,
                prev_page: hasPrevPage ? pageNumber - 1 : null
            },
            filters_applied: filters,
            sort_applied: { field: sortField, order: order }
        });

    } catch (error: any) {
        console.error("Get Bookings error:", error);
        res.status(500).json({
            success: false,
            code: "RETRIEVAL_ERROR",
            message: 'Error retrieving bookings'
        });
    }
};

// -- Get Single Booking Controller --
export const getBookingById = async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                code: "MISSING_BOOKING_ID",
                message: "Booking ID is required"
            });
        }

        // Validate ObjectId format
        if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_BOOKING_ID",
                message: "Invalid booking ID format"
            });
        }

        const booking = await bookingService.getBookingById(bookingId);

        res.status(200).json({
            success: true,
            message: "Booking retrieved successfully",
            data: booking
        });

    } catch (error: any) {
        console.error("Get booking by ID error:", error);

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                code: "BOOKING_NOT_FOUND",
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            code: "RETRIEVAL_ERROR",
            message: 'Error retrieving booking'
        });
    }
};

// -- Update Booking Controller --
export const updateBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;
        const updateData = req.body;
        // FIXED: Changed to userId to match the token payload structure
        const requestingUserId = (req as any).user?.userId; // From auth middleware

        // Validate booking ID
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                code: "MISSING_BOOKING_ID",
                message: "Booking ID is required"
            });
        }

        // Validate ObjectId format
        if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_BOOKING_ID",
                message: "Invalid booking ID format"
            });
        }

        // Validate requesting user
        if (!requestingUserId) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "User authentication required"
            });
        }

        console.log(`🔄 Updating booking ${bookingId} by user ${requestingUserId}`);

        const updatedBooking = await bookingService.updateBookingWithTransaction(
            bookingId,
            updateData,
            requestingUserId
        );

        console.log(`✅ Booking ${bookingId} updated successfully`);

        res.status(200).json({
            success: true,
            message: "Booking updated successfully",
            data: updatedBooking
        });

    } catch (error: any) {
        console.error("Update booking error:", error);

        // Handle specific errors
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                code: "BOOKING_NOT_FOUND",
                message: error.message
            });
        }

        if (error.message.includes('only update your own') || error.message.includes('authorization') || error.message.includes('can only update')) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: error.message
            });
        }

        if (error.message.includes('already started') || 
            error.message.includes('past time') || 
            error.message.includes('before end time')) {
            return res.status(400).json({
                success: false,
                code: "INVALID_UPDATE",
                message: error.message
            });
        }

        if (error.message.includes('conflicts') || error.message.includes('already booked')) {
            return res.status(409).json({
                success: false,
                code: "BOOKING_CONFLICT",
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            code: "UPDATE_ERROR",
            message: 'Error updating booking'
        });
    }
};

// -- Cancel Booking Controller --
export const cancelBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;
        // FIXED: Changed from _id to userId to match the token payload structure
        const requestingUserId = (req as any).user?.userId; // From auth middleware

        // Validate booking ID
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                code: "MISSING_BOOKING_ID",
                message: "Booking ID is required"
            });
        }

        // Validate ObjectId format
        if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_BOOKING_ID",
                message: "Invalid booking ID format"
            });
        }

        // Validate requesting user
        if (!requestingUserId) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "User authentication required"
            });
        }

        console.log(`❌ Cancelling booking ${bookingId} by user ${requestingUserId}`);

        const cancelledBooking = await bookingService.cancelBooking(bookingId, requestingUserId);

        console.log(`✅ Booking ${bookingId} cancelled successfully`);

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            data: cancelledBooking
        });

    } catch (error: any) {
        console.error("Cancel booking error:", error);

        // Handle specific errors
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                code: "BOOKING_NOT_FOUND",
                message: error.message
            });
        }

        if (error.message.includes('only cancel your own') || error.message.includes('can only cancel')) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: error.message
            });
        }

        if (error.message.includes('already started') || 
            error.message.includes('already cancelled')) {
            return res.status(400).json({
                success: false,
                code: "INVALID_CANCELLATION",
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            code: "CANCELLATION_ERROR",
            message: 'Error cancelling booking'
        });
    }
};
