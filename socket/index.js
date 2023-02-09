const redisClient = require("../database")
const { User, Chat } = require("../models")

module.exports = function(io){
    io.on("connection", async(socket) => {
        console.log(`Confirmed connection from ${socket.id}`)
        socket.emit("welcome", "Hello world")

        // To connect, the user must send it's id
        if (socket.handshake.query["userid"] !== undefined){
            try{
                // Checking if user exists
                const user = await User.findByIdAndUpdate(socket.handshake.query["userid"], {connected : true})
                if(user){

                    // Put the disconnection system in place
                    socket.on("disconnect", async()=>{
                        // Put the new connection in the redis database
                        redisClient.select(5)
                        const date = new Date();
                        redisClient.lPush(user._id + ":allDeconnections", ""+ date.toISOString())
            
                        console.log("User " + socket.handshake.query["userid"] + " disconected")
                        await User.updateOne({_id: socket.handshake.query["userid"]}, {connected : false})
                    })
    
                    // This is important : the user is disconnected only if he has been disconected for more than 5 seconds
                    redisClient.select(5)
                    const lastConnection = await redisClient.lRange(user._id + ":allDeconnections", 0, 0)
                    const lastConnectionTime = Date.parse(lastConnection)
                    const currentDate = Date.now()
                    
                    if(currentDate - lastConnectionTime < 5000){
                        redisClient.rPop(user._id + ":allDeconnections")
                    } else {
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
                    console.log("User "+ socket.handshake.query["userid"] + " couldn't be found")
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
}