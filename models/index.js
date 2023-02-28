const { Schema, model } = require("mongoose")

const userSchema = new Schema({
    email: {
        type: Schema.Types.String, 
        unique: true,
        required: true
    },
    pseudo: Schema.Types.String,
    password: Schema.Types.String,
    specialId: Schema.Types.String,
    connected: {
        type: Schema.Types.Boolean,
        default: false
    },
    conversations: [{type: Schema.Types.ObjectId, ref: "Chat"}]
})
userSchema.index({specialId: 1, pseudo: 1, unique: true})
userSchema.index({email: 1, unique: true})

const messageSchema = new Schema({
    from: {type: Schema.Types.ObjectId, ref: "User"},
    to: {type: Schema.Types.ObjectId, ref: "Chat"},
    content: {
        type: Schema.Types.String,
        default: ""
    }, 
    timestamp: { type : Schema.Types.Date, default: Date.now }
})

const chatSchema = new Schema({
    name: Schema.Types.String,
    public: {
        type: Schema.Types.Boolean,
        default: false
    },
})

// Creating a counter schema
// These counters will be the ones creating the user "specialId"
const counterSchema = new Schema({
    for: Schema.Types.String,
    nb: Schema.Types.Number
})
const Counter = model("Counter", counterSchema)

// We create a counter for the users
Counter.findOne({for: "User"}).then((res)=> {
    if (!res){
        userCounter = new Counter({for: "User", nb:0}) 
        userCounter.save()
    }
})

// We create a counter for the chats as well
Counter.findOne({for: "Chat"}).then((res)=> {
    if (!res){
        chatCounter = new Counter({for: "Chat", nb:0}) 
        chatCounter.save()
    }
})

// Setting up the "specialId"
// Before each save of new members, we increment the counter
// and create the specialId from that
userSchema.pre('save', async function(next){
    if(!this.specialId){
        const userCounter = await Counter.findOneAndUpdate({for: "User"}, {$inc: {nb: 1}})
        this.specialId = `_${userCounter.nb}`
    }
    next()
})

// It is possible that Chats don't have names.
// To fix this problem, we create one like "Chat X"
// where X is the number of the chat
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
    "Chat" : Chat,
}