const mongoose = require('mongoose');

const connectToDB = ()=>{
    mongoose.connect(process.env.DB_CONNECTION_STRING)
    .then((data)=>{
        console.log('connected to database');
    })
    .catch((err)=>{
        console.log(err.message);
    })
}


module.exports = connectToDB;
