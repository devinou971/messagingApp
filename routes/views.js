const express = require("express")
const {User, Chat, Message} = require("../models")
const {isUserConnected} = require("../utils")

// We need the redisClient here but they are
// defined in the "app.js" file. We didn't want 
// to do a "require("../app.js")"
// so we just export a function that creates the routes
module.exports = (redisClient) => {
    const viewRouter = express.Router()

    // Returns the home screen
    viewRouter.get("/", async function(req, res){
        res.render("home")
    })
    
    // Connection Page
    viewRouter.get("/connexion", async function(req, res){
        res.render("connexion")
    })
    
    // Chat Selection Page
    viewRouter.get("/main", async function(req, res){
        const mostActiveUsers = await Message.aggregate([
            {$match: {}},
            {$group: {_id: "$from", count: {$sum: 1}}},
            {$sort: {count: -1}},
            {$limit: 5}
        ]);
        for(const user of mostActiveUsers){
            const u = await User.findById(user._id);
            user.pseudo = u.pseudo + u.specialId;
            user.profilePicture = u.profilePicture;
        }
        res.render("main", {socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT, mostActiveUsers: mostActiveUsers})
    })
    
    // Chat Page
    viewRouter.get("/chat/:chatid", async function(req, res){
        const chat = await Chat.findById(req.params.chatid)
        
        if(chat){
            // If the chat if Public, we don't want to show all the users,
            // only the top 5 of the most active users (in terms of messages) 
            if(chat.public){
                const mostActiveUsers = await Message.aggregate([
                    {$match: {to: chat._id}},
                    {$group: {_id: "$from", count: {$sum: 1}}},
                    {$sort: {count: -1}},
                    {$limit: 5}
                ]);
                for(const user of mostActiveUsers){
                    const u = await User.findById(user._id);
                    user.pseudo = u.pseudo + u.specialId;
                    user.profilePicture = u.profilePicture;
                }
                res.render("chat", {chat: chat, socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT, mostActiveUsers: mostActiveUsers})
    
            } else {
                // We don't do backend stats for the private chats 
                // because it's easier to do it in te front end 
                res.render("chat", {chat: chat, socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT})
            }
        } else {
            res.sendStatus(404)
        }
    })
    
    // User Page
    viewRouter.get("/user/:userpseudo", async function(req, res){
        // The userpseudo is actually a combination of 
        // the peudo and the specialId 
        // So it's : User + _10 
        const array = req.params.userpseudo.split("_")
        const userSpecialId = "_" + array.pop()
        const userPseudo = array.join("_")
        
        const user = await User.findOne({pseudo: userPseudo, specialId: userSpecialId})
        if(user){
            // We want to show some stats for the user :
            // - The connection status
            // - The session durations
            // - The last connection date

            user.connected = await isUserConnected(user._id, redisClient)
            let allConnections = await redisClient.lRange(user._id + ":allConnections", 0, -1)
            allConnections = allConnections.reverse()
            let allDisconnections = await redisClient.lRange(user._id + ":allDisconnections", 0, -1)
            allDisconnections = allDisconnections.reverse()
            const sessionDurations = []

            // Calculating the session durations
            for(let i = allConnections.length; i > -1; i-- ){
                const connection = Date.parse(allConnections[i])
                if(allDisconnections[i]){
                    const disconnection = Date.parse(allDisconnections[i])
                    const millis = Math.abs(disconnection - connection)
                    const seconds =  Math.floor(millis / 1000)
                    const mins = Math.floor(seconds / 60)
                    if(!Number.isNaN(mins))
                        sessionDurations.push(mins)
                }
            }
            console.log(sessionDurations)
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
    
    // User creation Page
    viewRouter.get("/create/user/", async function(req, res){
        res.render("createUser", {socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT})
    })

    // Chat Creation Page    
    viewRouter.get("/create/chat", async function(req, res){
        res.render("createChat", {socketHost : process.env.SOCKET_HOST, listenPort: process.env.LISTEN_PORT})
    })
    
    return viewRouter;
}