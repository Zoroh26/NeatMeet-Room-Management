import express = require('express');
import { authenticateToken,authorize } from '../../../middlewares/auth.middleware';
const { getUsers,
  getAllUsers,
  getDeletedUsers,
  createUser, 
  getUserById, 
  updateUser,
  deleteUser,
  } = require('./user.controller');
import {validateCreateUser} from './user.validation'

const router = express.Router();

router.get('/',authenticateToken,authorize('admin'), getUsers);   
router.get('/all',authenticateToken,authorize('admin'),getAllUsers);
router.get('/deleted',authenticateToken,authorize('admin'),getDeletedUsers);      
router.post('/',authenticateToken,validateCreateUser, createUser);        
router.get('/:id',authenticateToken,authorize('admin'), getUserById);
router.put('/:id',authenticateToken,updateUser);
router.delete('/:id',authenticateToken,authorize('admin'),deleteUser);


module.exports = router;