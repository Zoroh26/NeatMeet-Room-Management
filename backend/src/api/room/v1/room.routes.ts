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
  updateRoomStatus
} from './room.controller';
import {
  createRoomValidation,
  handleValidationErrors
} from './room.validation';

const router = Router();

// GET routes
router.get('/', getRooms);                         
router.get('/all', getAllRooms);                   
router.get('/deleted', getDeletedRooms);           
router.get('/available', getAvailableRooms);       
router.get('/:id', getRoomById);  

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
