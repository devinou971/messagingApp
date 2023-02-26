const mongoose = require('mongoose');
const { createClient } = require("redis")

require("dotenv").config()

const REPLICASET_HOSTS = process.env.REPLICASET_HOSTS
const REDIS_PORT = process.env.REDIS_PORT
const REDIS_HOST = process.env.REDIS_HOST
const DB_NAME = process.env.DB_NAME
const REPLICASET_NAME = process.env.REPLICASET_NAME

module.exports = {initiate: async () => {
    mongoose.set('strictQuery', false)

    console.log(`mongodb://${REPLICASET_HOSTS}/${DB_NAME}?replicaSet=${REPLICASET_NAME}`)
    await mongoose.connect(`mongodb://${REPLICASET_HOSTS}/${DB_NAME}?replicaSet=${REPLICASET_NAME}`)
    console.log("Connection to Mongodb success");

    const redisClient = createClient({
        url: `redis://${REDIS_HOST}:${REDIS_PORT}`
    });
    redisClient.on('error', err => console.log('Redis Client Error', err));
    await redisClient.connect()
    console.log("Connection to Redis success");
    return redisClient;
}}