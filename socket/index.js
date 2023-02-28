const { User, Chat } = require("../models")


/*
  Creates all the basic interactions with the server socket
  @param redisClient is the connection to the redis database
  @param io is the socketIO instance
*/
function createSocket(redisClient, io){

    io.on("connection", async(socket) => {
        console.log(`Confirmed connection from ${socket.id}`)
        socket.emit("welcome", "Hello world");

        // If someone want to connect to the socket, he will need to have its id.
        const userid = socket.handshake.query["userid"];
        if (userid !== undefined){
            try{
                // Checking if user exists
                const user = await User.findByIdAndUpdate(userid, {connected : true})
                if(user){
                    socket.handshake.auth.userid = userid; 


                    // A user will be disconnected only 5 second after 
                    // the "disconect" event. 
                    // It's useful to not reconnect that user when he
                    // just change page in the app
                    socket.on("disconnect", async()=>{
                        setTimeout(()=>{
                            redisClient.select(5)
                            for(let [_, clientSocket] of io.sockets.sockets) {
                                if (clientSocket.handshake.auth.userid == userid){
                                    console.log("User " + userid + " still connected")
                                    return
                                }
                            }
                            const date = new Date();
                            // The redis database gets all the disconnections event
                            redisClient.lPush(user._id + ":allDisconnections", ""+ date.toISOString())
                            console.log("User " + userid + " disconnected")
                        },5000)
                    })
    
                    // The user is connected only if it's last disconnection is
                    // after it's last connection.  
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
                    
                    // The user is logged in all the rooms he occupies
                    // + all the public rooms
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
            socket.disconnect()
        }
    })
}

module.exports = {
    createSocket: createSocket
}