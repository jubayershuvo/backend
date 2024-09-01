import express from 'express';

const app = express();
const port = process.env.PORT || 8080;


app.get('/',(req, res)=>{
    return res.send('ok')
})






app.listen(port,()=>{
    console.log(`Your server running at http://localhost:${port}`);
});