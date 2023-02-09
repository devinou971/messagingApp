const mongoose = require('mongoose');
const { createClient } = require("redis")

require("dotenv").config()

const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const REDIS_PORT = process.env.REDIS_PORT
const REDIS_HOST = process.env.REDIS_HOST
const DB_NAME = process.env.DB_NAME

mongoose.set('strictQuery', false)

mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`, (err) => {
    if (err){
        throw err
    }
    console.log("Connected to database")    
})

const redisClient = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});
redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.connect()

module.exports = redisClient