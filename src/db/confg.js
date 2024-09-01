import mongoose from 'mongoose';
import { DB_NAME, DB_URL } from '../constans.js';

const db_url = `${DB_URL}/${DB_NAME}`;

async function db_connect(options ={}){
    try {
        const connectionInstance = await mongoose.connect(db_url, options);
        console.log('==== DB Connected ===');
        console.log(`DB_HOST: ${connectionInstance.connection.host}`);

        mongoose.connection.on('error', (error)=> {
            console.log('==== DB Connection Lost ====');
        })
    } catch (error) {
        console.log('==== DB Connection Faild ====', error.toString());
    }
};

export default db_connect;