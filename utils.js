// return whether the user is connected or not
async function isUserConnected(userId, redisClient){
    redisClient.select(5)
    let lastDeconnection = await redisClient.lRange(userId + ":allDisconnections", 0, 0)
    let lastConnection = await redisClient.lRange(userId + ":allConnections", 0, 0)
    if (lastConnection.length < 1){
        console.log("There are no connections so user " + userId + " is not connected")
        return false
    } else if(lastDeconnection.length < 1) {
        console.log("There are no disconnections so user " + userId + " is connected")
        return true
    } else {
        lastConnection = new Date(lastConnection[0])
        lastDeconnection = new Date(lastDeconnection[0])
        console.log("The user " + userId + " has : " + lastConnection + " " + lastDeconnection + " " + lastConnection > lastDeconnection)
        return lastConnection > lastDeconnection
    }
}

module.exports = {
    isUserConnected: isUserConnected 
}