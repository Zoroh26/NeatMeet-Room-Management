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
import { authenticateToken } from '../../../middlewares/auth.middleware';
import { allowPasswordChangeRoutes } from '../../../middlewares/password-change.middleware';

const router = Router();

// Apply authentication and password change middleware to all routes
router.use(authenticateToken);
router.use(allowPasswordChangeRoutes);

// GET routes
router.get('/rooms', getRooms);                         
router.get('/all', getAllRooms);                   
router.get('/deleted', getDeletedRooms);           
router.get('/available', getAvailableRooms);       
router.get('/:id', getRoomById);
router.get('/schedule/:id', getRoomSchedule);      
router.get('/availability/:id', checkRoomAvailability);  

// POST routes
router.post('/room', createRoomValidation, handleValidationErrors, createRoom);  

// PUT routes  
router.put('/:id', updateRoom);
router.put('/status/:id', updateRoomStatus);  
router.put('/restore/:id', restoreRoom);  

// DELETE routes
router.delete('/:id', deleteRoom);  
router.delete('/hard/:id', hardDeleteRoom);  

module.exports = router;
