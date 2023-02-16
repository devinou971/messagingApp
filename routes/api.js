const express = require("express")
const {io, redisClient} = require("../app")

const {User, Chat, Message} = require("../models")

const apiRouter = express.Router()

apiRouter.get("/ping", function(req, res){
    res.json({
        status: "OK",
        timestamp: (new Date()).getTime()
    })
})

// POST chat to create a chat
// Must send the infos of the chat as well as the userId to add the server to the user's list
apiRouter.post("/chat/", async function(req, res){
    const owner = await User.findOne({_id: req.body.userid})
    if (owner !== undefined){
        const chat = new Chat(req.body)
        await chat.save()
        if(!chat.public){
            owner.conversations.push(chat._id)
            await owner.save()
        }
        res.json(chat)
    } else {
        res.json({error: "Owner not defined"})
    }
})


// GET all public chats
apiRouter.get("/chat/", async function(req, res){
    res.json(await Chat.find({public: true}))
})

// GET chat to get chat informations
apiRouter.get("/chat/:id", async function(req, res){
    const id = req.params.id
    const chat = await Chat.findById(id)
    if (chat){
        res.json(chat)
    } else {
        res.json({error: "No chat found"})
    }
})

// GET chat to users in chat
apiRouter.get("/chat/:id/users", async function(req, res){
    const id = req.params.id
    const chat = await Chat.findById(id)
    if (chat){
        const users = await User.find({conversations: chat._id}).select("-password -conversations")
        redisClient.select(5)
        for(let user of users){
            let lastDeconnection = await redisClient.lRange(user._id + ":allDeconnections", 0, 0)
            let lastConnection = await redisClient.lRange(user._id + ":allConnections", 0, 0)
            if (lastConnection.length < 1){
                console.log("There are no connections so user " + user._id + " is not connected")
                user.connected = false
            } else if(lastDeconnection.length < 1) {
                console.log("There are no disconnections so user " + user._id + " is connected")
                user.connected = true
            } else {
                lastConnection = new Date(lastConnection[0])
                lastDeconnection = new Date(lastDeconnection[0])
                console.log("The user " + user._id + " has : " + lastConnection + " " + lastDeconnection + " " + lastConnection > lastDeconnection)
                user.connected = lastConnection > lastDeconnection
            }
        }
        res.json(users)
    } else {
        res.json({error: "No chat found"})
    }
})

// GET chat of a user
apiRouter.get("/chat/user/:userid", async function(req, res){
    const id = req.params.userid
    const user = await User.findById(id)
    const publicServers = await Chat.find({public: true})
    if (user){
        await user.populate()
        res.json(publicServers.concat(user.conversations))
    } else {
        res.json({error: "No chat found"})
    }
})

// PUT : invite a user to a chat
apiRouter.put("/user/:userid/chat/:chatid", async function(req, res){
    const user = await User.findById(req.params.userid)
    const chat = await Chat.findById(req.params.chatid)
    if(user && chat){
        if (user.conversations.includes(chat._id)){
            res.json({error: "This user is already in this chat"})
        } else {
            user.conversations.push(chat._id)
            await user.save()
            
            res.json({response: "Ok"})
        }
    } else {
        res.json({error: "This user or chat couldn't be found"})
    }
})

// ( DELETE chat to delete a chat )

// POST message
apiRouter.post("/message/", async function(req, res){
    if(await Chat.exists({_id: req.body.to}) && await User.exists({_id: req.body.from})){
        const message = new Message(req.body)
        await message.save()
        await message.populate({
            path: "from",
            select: "pseudo specialId connected"
        })
        await message.populate("to")

        io.to(""+ message.to._id).emit("new message", message)
        
        res.json(message)
    } else {
        res.json({error: "That chat or user doesn't exists"})
    }
})


// GET message


// GET all messages
apiRouter.get("/message/", async function(req, res){
    const allMessages = await Message.find({})
    for (let message of allMessages){
        message = await message.populate({
            path: "from",
            select: "pseudo specialId connected"
        })
        message = await message.populate("to")
    }
    res.json(allMessages)
})

// GET messages of chat 
apiRouter.get("/chat/:chatid/messages", async function(req, res){
    const chatId = req.params.chatid
    const allMessages = await Message.find({to: chatId})
    for (let message of allMessages){
        message = await message.populate("from")
        message.from.password = ""
        message.from.conversations = []
    }
    if(allMessages.length == 0){
        res.json({error: "No messages found to conversation " + chatId})
    } else {
        res.json(allMessages)
    }
})

// GET messages of user
apiRouter.get("/user/:userid/messages", async function(req, res){
    const userId = req.params.userid
    const allMessages = await Message.find({from: userId})
    for (let message of allMessages){
        message = await message.populate("to")
    }
    if(allMessages.length == 0){
        res.json({error: "No messages found for user " + userId})
    } else {
        res.json(allMessages)
    }
})
// ( DELETE message ) 



// POST user to create a user
apiRouter.post("/user", async function(req, res){
    console.log(req.body)
    newUser = new User(req.body)
    await newUser.save()
    res.json(newUser)
})

// GET user
apiRouter.get("/user/:id", async function(req, res){
    const id = req.params.id  
    const user = await User.findOne({_id: id}).select("-password")
    if (user){
        res.json(user)
    } else {
        res.json({error: "User Not Found"})
    }
})

// GET find user
apiRouter.get("/user/find/:pseudo", async function(req, res){
    const pseudoid = req.params.pseudo
    const pseudo = pseudoid.split("_")[0]
    const specialId = "_" + pseudoid.split("_")[1]
    const user = await User.findOne({pseudo: pseudo, specialId: specialId}).select("-password")
    if (user){
        res.json(user)
    } else {
        res.json({error: "User Not Found"})
    }
})

// GET all users
apiRouter.get("/user/", async function(req, res){
    const users = await User.find({}, { pseudo: 1, specialId: 1, connected: 1})
    res.json(users)
})

// POST connect the user 
apiRouter.post("/user/connect", async function(req, res){
    const userPseudoId = req.body.pseudo
    const password = req.body.password
    if(userPseudoId && password){
        const userPseudo = userPseudoId.split("_")[0]
        const userSpecialId = "_" + userPseudoId.split("_")[1]
        const foundUser = await User.findOne({pseudo: userPseudo, specialId: userSpecialId, password: password}).select("-password")
        if(foundUser){
            res.json(foundUser)
        } else {
            res.json({error: "pseudo or password incorrect"})
        }
    } else {
        res.json({error : "pseudo and password must be present in the request body"})
    }
})

// ( DELETE USER )
module.exports = apiRouter