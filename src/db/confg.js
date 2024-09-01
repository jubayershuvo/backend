import mongoose from 'mongoose';

const db_url = 'mongodb+srv://jubayer_shuvo:Jubayer2@cluster0.7q7wicy.mongodb.net/authApp';

async function db_connect(options ={}){
    try {
        await mongoose.connect(db_url, options);
        console.log('==== DB Connected ===');

        mongoose.connection.on('error', (error)=> {
            console.log('==== DB Connection Lost ====');
        })
    } catch (error) {
        console.log('==== DB Connection Faild ====', error.toString());
    }
};

export default db_connect;