const express = require("express")
const {User, Chat, Message} = require("../models")
const {isUserConnected} = require("../utils")
const redisClient = require("../database")

const viewRouter = express.Router()

// Connection screen
viewRouter.get("/", async function(req, res){
    res.render("home")
})

viewRouter.get("/connexion", async function(req, res){
    res.render("connexion")
})

viewRouter.get("/main", async function(req, res){
    res.render("main")
})

viewRouter.get("/chat/:chatid", async function(req, res){
    const chat = await Chat.findById(req.params.chatid)
    if(chat){
        res.render("chat", {chat: chat, socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT})

    } else {
        res.sendStatus(404)
    }
})

viewRouter.get("/user/:userpseudo", async function(req, res){
    const array = req.params.userpseudo.split("_")
    const userSpecialId = "_" + array.pop()
    const userPseudo = array.join("_")
    
    const user = await User.findOne({pseudo: userPseudo, specialId: userSpecialId})
    if(user){
        user.connected = await isUserConnected(user._id, redisClient)
        let allConnections = await redisClient.lRange(user._id + ":allConnections", 0, -1)
        allConnections = allConnections.reverse()
        let allDisconnections = await redisClient.lRange(user._id + ":allDisconnections", 0, -1)
        allDisconnections = allDisconnections.reverse()
        const sessionDurations = []
        for(let i = allConnections.length; i > -1; i-- ){
            const connection = Date.parse(allConnections[i])
            if(allDisconnections[i]){
                const disconnection = Date.parse(allDisconnections[i])
                const millis = Math.abs(disconnection - connection)
                const seconds =  Math.floor(millis / 1000)
                const mins = Math.floor(seconds / 60)
                sessionDurations.push("" + mins)
            }
        }

        const lastConnection = Date.parse(allConnections[allConnections.length-1])
        const nbMessages = await Message.countDocuments({from: user._id})
        const infos = {
            lastConnection: lastConnection,
            sessions: sessionDurations,
            nbMessages: nbMessages
        }

        res.render("userPage", {user: user, infos: infos, socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT})
    } else {
        res.sendStatus(404)
    }
})

viewRouter.get("/create/user/", async function(req, res){
    res.render("createUser", {socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT})
})

viewRouter.get("/create/chat", async function(req, res){
    res.render("createChat", {socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT})
})

module.exports = viewRouter