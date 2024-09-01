import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { cors_origin } from './constans.js';
import cookieParser from 'cookie-parser';

const app = express();


app.use(express.json({limit:"1MB"}));
app.use(express.urlencoded({extended:true, limit:"1MB"}));
app.use(morgan('tiny'));
app.use(cors({
    origin: cors_origin,
}));
app.use(express.static("public"));
app.use(cookieParser());



app.get('/',(req, res)=>{
    return res.status(200).json({success:true, message:"Server running"});
});
app.get('/:username',(req, res)=>{
    const {username} = req.params;
    return res.status(200).json({success:true, message:`Hi ${username}`});
});
app.get('*',(req, res)=>{
    return res.status(404).json({success:false, message:"Page dosen't exist"});
});


export default app;