const express = require("express")
const {User, Chat, Message} = require("../models")

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

module.exports = viewRouter