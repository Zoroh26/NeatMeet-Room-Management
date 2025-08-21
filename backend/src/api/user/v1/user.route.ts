import express = require('express');
import { authenticateToken,authorize } from '../../../middlewares/auth.middleware';
const { getUsers,
  getAllUsers,
  getDeletedUsers,
  createUser, 
  getUserById, 
  updateUser,
  deleteUser,
  hardDeleteUser,
  restoreUser} = require('./user.controller');
import {validateCreateUser} from './user.validation'

const router = express.Router();

router.get('/users',authenticateToken,authorize(['admin']), getUsers);   
router.get('/all',authenticateToken,authorize(['admin']),getAllUsers);
router.get('/deleted',authenticateToken,authorize(['admin']),getDeletedUsers)  ;      
router.post('/user',authenticateToken,authorize(['admin']),validateCreateUser, createUser);        
router.get('/:id',authenticateToken,authorize(['admin']), getUserById);
router.put('/:id',authenticateToken,updateUser);
router.patch('/:id',authenticateToken,authorize(['admin']),deleteUser)
module.exports = router;