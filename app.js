// Import packages
const express = require("express")
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const http = require("http");
const { User, Chat } = require("./models")
require("./database")


const {Server} = require("socket.io")
require("dotenv").config()

// Create the app
const app = express();

// Configure server
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.set('view engine', 'ejs');

// Setup HTTP server
const server = http.createServer(app);

server.listen(process.env.LISTEN_PORT);

server.on('listening', function () {
    console.log("Le serveur est allumé");
});

server.on('error', function (error) {
    console.error(error);
});

const io = new Server(server, {
    cors: {
        origin: (requestOrigin, callback) => {
            callback(undefined, requestOrigin)
        },
        methods: ["GET", "POST"]
    }
})

io.on("connection", async(socket) => {
    console.log(`Confirmed connection from ${socket.id}`)
    socket.emit("welcome", "Hello world")
    if (socket.handshake.query["userid"] !== undefined){
        try{
            
            const user = await User.findByIdAndUpdate(socket.handshake.query["userid"], {connected : true})
            if(user){
                user.connected = true
                user.save()
                const publicChats = await Chat.find({public: true})
                const chatIds = (user.conversations.concat(publicChats.map(x => x._id))).map(x => "" + x)
                console.log(socket.id + " Logging into rooms " + chatIds)
                socket.join(chatIds)
            } else {
                console.log("User "+ socket.handshake.query["userid"] + " couldn't be found")
            }
        } catch (e){
            console.log(e)
        }

        socket.on("disconnect", async()=>{
            console.log("User " + socket.handshake.query["userid"] + " disconected")
            await User.updateOne({_id: socket.handshake.query["userid"]}, {connected : false})
        })

    } else {
        console.log("UserId undefined")
    }
})

module.exports = io

const apiRouter = require("./routes/api");
const viewRouter = require("./routes/views");

app.use("/api", apiRouter)
app.use("/", viewRouter)

app.use("/static", express.static("static"))