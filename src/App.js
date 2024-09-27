import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { cors_origin } from './constans.js';
import userRouter from './routers/userRoutes.js';
import adminRouter from './routers/adminRoute.js';

const app = express();


app.use(express.json({limit:"1MB"}));
app.use(express.urlencoded({extended:true, limit:"1MB"}));
app.use(morgan('tiny'));
app.use(cors(
   
   {
    origin: cors_origin,
    credentials: true
   }

));
app.use(express.static("public"));
app.use(cookieParser());



app.use('/api/v1/users', userRouter);
app.use('/api/v1/admin', adminRouter);


export default app;