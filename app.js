// Import packages
const express = require("express")
const cookieParser = require("cookie-parser");
const logger = require("morgan");

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
const server = require("http").createServer(app);

server.listen(process.env.LISTEN_PORT);

server.on('listening', function () {
    console.log("Le serveur est allumé");
});

server.on('error', function (error) {
    console.error(error);
});

const io = require("socket.io")(server, {
    cors: {
        origin: (requestOrigin, callback) => {
            callback(undefined, requestOrigin)
        },
        methods: ["GET", "POST"]
    }
});

const redisClient = require("./socket")(io);

module.exports = {
    io: io,
    redisClient: redisClient
}

const apiRouter = require("./routes/api");
const viewRouter = require("./routes/views");

app.use("/api", apiRouter)
app.use("/", viewRouter)

app.use("/static", express.static("static"))