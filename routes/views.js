const express = require("express")


const viewRouter = express.Router()

// Connection screen
viewRouter.get("/", async function(req, res){
    res.render("home")
})

viewRouter.get("/connexion", async function(req, res){
    res.render("connexion")
})

viewRouter.get("/main", async function(req, res){
    res.render("main")
})


module.exports = viewRouter