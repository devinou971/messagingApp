const redisClient = require("../database")
const { User, Chat } = require("../models")

function createSocket(io){
    io.on("connection", async(socket) => {
        console.log(`Confirmed connection from ${socket.id}`)
        socket.emit("welcome", "Hello world")

        const userid = socket.handshake.query["userid"]

        // To connect, the user must send it's id
        if (userid !== undefined){
            try{
                // Checking if user exists
                const user = await User.findByIdAndUpdate(userid, {connected : true})
                if(user){
                    socket.handshake.auth.userid = userid 
                    // Put the disconnection system in place
                    socket.on("disconnect", async()=>{
                        // Put the new connection in the redis database
                        setTimeout(()=>{
                            redisClient.select(5)
                            for(let [_, clientSocket] of io.sockets.sockets) {
                                if (clientSocket.handshake.auth.userid == userid){
                                    console.log("User " + userid + " still connected")
                                    return
                                }
                            }
                            const date = new Date();
                            redisClient.lPush(user._id + ":allDisconnections", ""+ date.toISOString())
                            console.log("User " + userid + " disconnected")
                        },5000)
                    })
    
                    // This is important : the user is disconnected only if he has been disconected for more than 5 seconds
                    redisClient.select(5)
                    const lastConnection = await redisClient.lRange(user._id + ":allConnections", 0, 0)
                    const lastConnectionTime = Date.parse(lastConnection)

                    const lastDeconnection = await redisClient.lRange(user._id + ":allDisconnections", 0, 0)
                    const lastDeconnectionTime = Date.parse(lastDeconnection)
                    
                    if(lastConnectionTime < lastDeconnectionTime || Number.isNaN(lastConnectionTime)){
                        // Put the new connection in the redis database
                        const date = new Date();
                        redisClient.lPush(user._id + ":allConnections", ""+ date.toISOString())
                    }
                    
                    // Logging user into the appropriate rooms
                    const publicChats = await Chat.find({public: true})
                    const chatIds = (user.conversations.concat(publicChats.map(x => x._id))).map(x => "" + x)
                    console.log(socket.id + " Logging into rooms " + chatIds)
                    socket.join(chatIds)
                } else {
                    console.log("User "+ userid + " couldn't be found")
                    socket.disconnect()
                }
            } catch (e){
                console.log(e)
                socket.disconnect()
            }
        } else {
            console.log("UserId undefined")
        }
    })
    return redisClient
}

module.exports = {
    createSocket: createSocket,
    redisClient: redisClient
}