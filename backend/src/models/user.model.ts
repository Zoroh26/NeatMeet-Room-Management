import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt'

interface IUser extends mongoose.Document {
  user_id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
  designation: string;
  isDeleted:boolean;
  deletedAt:Date|null;
  createdAt:Date;
  updatedAt:Date;
  comparePassword(candidatePassword:string):Promise<boolean>;
  isInitialPassword:Boolean;
}

const userSchema = new Schema<IUser>({
  user_id: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    default: () => new mongoose.Types.ObjectId() 
  },
  name: { 
    type: String, 
    required: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: [6, 'Password must be at least 6 characters long'],
    maxlength: [128, 'Password cannot exceed 128 characters']
  },
  role: { 
    type: String, 
    enum: ['admin', 'employee'], 
    required: true 
  },
  designation: { 
    type: String, 
    required: true
  },
  isDeleted:{
    type:Boolean,
    default:false
  },
  deletedAt:{
    type:Date,
    default:null
  },
  
  isInitialPassword:{
    type:Boolean,
    default:true
  }
  

}, { timestamps: true });

userSchema.index({isDeleted : 1})
userSchema.index({isDeleted:1})

userSchema.pre('save',async function(next){
  if(!this.isModified('password'))return next();

  try{
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password,saltRounds)
  }catch(error:any){
    next(error);
  }
})

userSchema.pre('findOneAndUpdate',async function(next){
  const update =this.getUpdate() as any
 if(update.password) {
  try{
    const saltRounds=12;
    update.password =await bcrypt.hash(update.password,saltRounds);
    next();
  }catch(error:any){
    next(error);
  }}
  else{
    next();
  }
})
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};
module.exports = mongoose.model<IUser>('User', userSchema);
