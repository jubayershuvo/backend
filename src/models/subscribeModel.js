import mongoose from 'mongoose';

const subscriberSchema = new Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    channel:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{timestamps:true});



export const Subscribe = mongoose.model('Subscribe', subscriberSchema);