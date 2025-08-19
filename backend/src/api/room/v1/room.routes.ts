import { Router } from 'express';
import {
  getRooms,
  getAllRooms,
  getDeletedRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  hardDeleteRoom,
  restoreRoom,
  getAvailableRooms,
  updateRoomStatus,
  getRoomSchedule,
  checkRoomAvailability
} from './room.controller';
import {
  createRoomValidation,
  handleValidationErrors
} from './room.validation';
import { authenticateToken } from '../../../middlwares/auth.middleware';
import { allowPasswordChangeRoutes } from '../../../middlwares/password-change.middleware';

const router = Router();

// Apply authentication and password change middleware to all routes
router.use(authenticateToken);
router.use(allowPasswordChangeRoutes);

// GET routes
router.get('/', getRooms);                         
router.get('/all', getAllRooms);                   
router.get('/deleted', getDeletedRooms);           
router.get('/available', getAvailableRooms);       
router.get('/:id', getRoomById);
router.get('/:id/schedule', getRoomSchedule);      
router.get('/:id/availability', checkRoomAvailability);  

// POST routes
router.post('/', createRoomValidation, handleValidationErrors, createRoom);  

// PUT routes  
router.put('/:id', updateRoom);
router.put('/:id/status', updateRoomStatus);  
router.put('/:id/restore', restoreRoom);  

// DELETE routes
router.delete('/:id', deleteRoom);  
router.delete('/:id/hard', hardDeleteRoom);  

module.exports = router;
