const mongoose = require('mongoose')
require("dotenv").config();

const connectDB = async () => {
    try{
        console.log("MongoDB URI: ",process.env.MONGODB_URI)
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to MongoDB: ${conn.connection.host}`); 
    } catch(e){
        console.error(`Error connecting to MongoDB: ${e.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;