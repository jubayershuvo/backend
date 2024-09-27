import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { access_token_expiry, access_token_secret_key, refresh_token_expiry, refresh_token_secret_key } from '../constans.js';

const userSchema = new Schema({
    username:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        index:true,
        trim:true
    },
    email:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type: String,
        required:true,
        index:true,
        trim:true
    },

    avatar:{
        type:String,
    },
    coverImg:{
        type:String
    },
    watchHistry:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
        },
    ],
    password:{
        type:String,
        required:[true, 'Password is Required'],
        trim:true,
        minlength: [6,'Name will be 6 characters minimum'],
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    isBanned:{
        type:Boolean,
        default:false
    },
    isOwner:{
        type:Boolean,
        default:false
    },
    refreshToken:{
        type:String
    },
    adminRefreshToken:{
        type:String
    }

},{timestamps:true});

userSchema.pre("save", async function (next){
    if(!this.isModified("password")){
        return next();
    }
        
    this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(10))
    next()
})
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username:this.username,
        fullname: this.fullname,
        isAdmin: this.isAdmin,
        isBanned: this.isBanned,
        isOwner: this.isOwner
    },access_token_secret_key, {expiresIn:access_token_expiry });
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
    },refresh_token_secret_key, {expiresIn: refresh_token_expiry});
}
export const User = mongoose.model("User", userSchema);