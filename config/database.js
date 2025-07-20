const mongoose = require("mongoose")
require("dotenv").config();

exports.connect = () =>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(
        console.log("DB Connection SUCCESSFUL")
    )
    .catch((error)=>{
        console.log("DB CONNECTION FAILED")
        console.error(error);
        process.exit(1);
    })
}