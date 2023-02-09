const mongoose = require('mongoose');
require("dotenv").config()

const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
mongoose.set('strictQuery', false)

mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`, (err) => {
    if (err){
        throw err
    }
    console.log("Connected to database")    
})
