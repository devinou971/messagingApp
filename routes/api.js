const express = require("express")
const {User, Chat, Message} = require("../models")
const {isUserConnected} = require("../utils")

// We need the redisClient as well as the socket 
// but they are defined in the "app.js" file.
// We didn't want to do a "require("../app.js")"
// so we just export a function that creates the routes
module.exports = (io, redisClient) => {

    const apiRouter = express.Router()

    apiRouter.get("/ping", function(req, res){
        res.json({
            status: "OK",
            timestamp: (new Date()).getTime()
        })
    })

    // Creates a new chat
    // if the chat is private, the user creating the chat is added
    apiRouter.post("/chat/", async function(req, res){
        // If you try "findById" with an incorrect id
        // it crashes, so we do this little check
        if(req.body.userid && req.body.userid.length == 24){
            const owner = await User.findById(req.body.userid)
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
        } else {
            res.json({error: "Owner not defined"})
        }
        
    })


    // Returns all the public chats 
    apiRouter.get("/chat/", async function(req, res){
        res.json(await Chat.find({public: true}))
    })

    // Returns 1 specific chat 
    apiRouter.get("/chat/:id", async function(req, res){
        const id = req.params.id
        const chat = await Chat.findById(id)
        if (chat){
            res.json(chat)
        } else {
            res.json({error: "No chat found"})
        }
    })

    // 
    apiRouter.get("/chat/:id/stats", async function(req, res){
        const id = req.params.id;
        const chat = await Chat.findById(id);
        if(chat){
            
        } else {
            res.json({error: "This chat doesn't exist"})
        }
    })

    // Returns all the users in a chat
    // Only works if chat is public
    apiRouter.get("/chat/:id/users", async function(req, res){
        const id = req.params.id
        const chat = await Chat.findById(id)
        if (chat){
            const users = await User.find({conversations: chat._id}).select("-password -conversations -email")
            redisClient.select(5)
            for(let user of users){
                user.connected = await isUserConnected(user._id, redisClient)
            }
            res.json(users)
        } else {
            res.json({error: "No chat found"})
        }
    })

    // Returns chats of a user
    // Including all the public chats
    apiRouter.get("/user/:userid/chats", async function(req, res){
        const id = req.params.userid
        const user = await User.findById(id)
        const publicServers = await Chat.find({public: true})
        if (user){
            await user.populate({
                path: "conversations"
            })
            res.json(publicServers.concat(user.conversations))
        } else {
            res.json({error: "No chat found"})
        }
    })

    // Includes a user to a chat
    // If the user is already in the chat, an error is returned
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

    // Creates a new message in database
    apiRouter.post("/message/", async function(req, res){
        if(await Chat.exists({_id: req.body.to}) && await User.exists({_id: req.body.from})){
            const message = new Message(req.body)
            await message.save()

            // After saving, we send notification to all 
            // the users in the chat
            await message.populate({
                path: "from",
                select: "pseudo specialId connected profilePicture"
            })
            await message.populate("to")

            io.to(""+ message.to._id).emit("new message", message)
            
            res.json(message)
        } else {
            res.json({error: "That chat or user doesn't exists"})
        }
    })

    // Returns all messages in the database
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

    // Returns all messages of 1 chat 
    apiRouter.get("/chat/:chatid/messages", async function(req, res){
        const chatId = req.params.chatid
        const allMessages = await Message.find({to: chatId})
        for (let message of allMessages){
            message = await message.populate("from")
            message.from.password = ""
            message.from.conversations = []
        }
        
        res.json(allMessages)
    
    })

    // Returns all the messages of 1 user
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

    // Creates a new user
    apiRouter.post("/user", async function(req, res){
        // We check if the email and pseudo are there.
        if(!req.body.email || !req.body.pseudo){
            res.json({error: "The new user must have an email and a pseudo"});
        } else {

            // Checking if the email is already used
            const existingUser = await User.findOne({email: req.body.email});
            if(existingUser) {
                res.json({error: "This email is already in use"})    
            } else {

                // Checking if the email is really an email
                if( ! /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)){
                    res.json({error: "The mail is in the wrong format"})    
                } else {
                    newUser = new User(req.body);
                    await newUser.save();
                    res.json(newUser);
                }
            }
        }
    })

    // Returns 1 user (without password, conversations & email)
    apiRouter.get("/user/:id", async function(req, res){
        const id = req.params.id  
        const user = await User.findOne({_id: id}).select("-password -email")
        if (user){
            res.json(user)
        } else {
            res.json({error: "User Not Found"})
        }
    })

    // Returns the user that has the passed pseudo
    apiRouter.get("/find/user/:pseudo", async function(req, res){
        // the "pseudo" is made of a psuedo and a special id (_1)
        // for example : Test_32
        const array = req.params.pseudo.split("_")
        const specialId = "_" + array.pop()
        const pseudo = array.join("_")
        const user = await User.findOne({pseudo: pseudo, specialId: specialId}).select("-password -email")
        if (user){
            res.json(user)
        } else {
            res.json({error: "User Not Found"})
        }
    })

    // Returns the list of all users
    apiRouter.get("/user/", async function(req, res){
        const users = await User.find({}, { pseudo: 1, specialId: 1, connected: 1})
        res.json(users)
    })

    // Verifies the email and password of a user 
    // Returns True is everything checks out 
    //          False if not
    apiRouter.post("/user/connect", async function(req, res){
        const email = req.body.email
        const password = req.body.password
        if(email && password){
            const foundUser = await User.findOne({email: email, password: password}).select("-password -email -conversations")
            if(foundUser){
                res.json(foundUser)
            } else {
                res.json({error: "email or password incorrect"})
            }
        } else {
            res.json({error : "email and password must be present in the request body"})
        }
    })

    return apiRouter;
}