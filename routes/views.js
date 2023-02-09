const express = require("express")

const viewRouter = express.Router()

// Connection screen
viewRouter.get("/", async function(req, res){
    res.render()
})

module.exports = viewRouter
