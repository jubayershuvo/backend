import app from './App.js'
import { port } from './constans.js';
import db_connect from './db/confg.js';

app.get('/',(req, res)=>{
    return res.status(200).json({success:true, message:"Server running"});
});

app.get('*',(req, res)=>{
    return res.status(404).json({success:false, message:"Api route dosen't exist..!"});
});
app.listen(port,()=>{
    console.log(`Your server running at http://localhost:${port}`);
    db_connect();
});