import app from './App.js'
import { port } from './constans.js';
import db_connect from './db/confg.js';


app.listen(port,()=>{
    console.log(`Your server running at http://localhost:${port}`);
    db_connect();
});