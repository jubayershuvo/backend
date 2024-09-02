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





import userRouter from './routers/usrRoutes.js';

app.use('/api/v1/users', userRouter);


export default app;