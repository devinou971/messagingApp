const { Schema, model } = require("mongoose")

const userSchema = new Schema({
    pseudo: Schema.Types.String,
    password: Schema.Types.String, 
    specialId: Schema.Types.String,
    connected: {
        type: Schema.Types.Boolean,
        default: false
    },
    conversations: [{type: Schema.Types.ObjectId, ref: "Chat"}],
    lastDeconnection: {
        type: Schema.Types.Date,
        default: Date.now
    }
})
userSchema.index({specialId: 1, pseudo: 1, type: 1, unique: true})


const messageSchema = new Schema({
    from: {type: Schema.Types.ObjectId, ref: "User"},
    to: {type: Schema.Types.ObjectId, ref: "Chat"},
    content: Schema.Types.String, 
    timestamp: { type : Schema.Types.Date, default: Date.now }
})

const chatSchema = new Schema({
    name: Schema.Types.String,
    public: {
        type: Schema.Types.Boolean,
        default: false
    },
})

const counterSchema = new Schema({
    for: Schema.Types.String,
    nb: Schema.Types.Number
})

const Counter = model("Counter", counterSchema)


Counter.findOne({for: "User"}).then((res)=> {
    if (!res){
        userCounter = new Counter({for: "User", nb:0}) 
        userCounter.save()
    }
})


Counter.findOne({for: "Chat"}).then((res)=> {
    if (!res){
        chatCounter = new Counter({for: "Chat", nb:0}) 
        chatCounter.save()
    }
})


userSchema.pre('save', async function(next){
    if(!this.specialId){
        const userCounter = await Counter.findOneAndUpdate({for: "User"}, {$inc: {nb: 1}})
        this.specialId = `_${userCounter.nb}`
    }
    next()
})


chatSchema.pre('save', async function(next){
    if(!this.name){
        const chatCounter = await Counter.findOneAndUpdate({for: "Chat"}, {$inc: {nb: 1}})
        this.name = `Chat ${chatCounter.nb}`
    }
    next()
})

const User = model("User", userSchema)
const Message = model("Message", messageSchema)
const Chat = model("Chat", chatSchema)

module.exports = {
    "User" : User,
    "Message" : Message,
    "Chat" : Chat
}