import app from './App.js'
import db_connect from './db/confg.js';
const port = process.env.PORT || 8080;


app.listen(port,()=>{
    console.log(`Your server running at http://localhost:${port}`);
    db_connect()
});