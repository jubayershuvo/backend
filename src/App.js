import express from 'express';

const app = express();


app.get('/',(req, res)=>{
    return res.send('ok')
})
app.get('/',(req, res)=>{
    return res.send('ok')
})


export default app;