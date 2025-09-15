import { Router } from 'express';
import {
  getRooms,
  getAllRooms,
  getDeletedRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
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
router.get('/check-availability', checkAvailability);
    
router.get('/:id', getRoomById);  

// POST routes
router.post('/room', createRoomValidation, handleValidationErrors, createRoom);  

// PUT routes  
router.put('/:id', updateRoom);


// DELETE routes
router.delete('/:id', deleteRoom);  


module.exports = router;
