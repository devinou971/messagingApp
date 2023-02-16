const user = JSON.parse(sessionStorage.getItem("user"))
if(!user){
    window.location.replace("/connexion")
}

const socket = io(`${socketHost}?userid=${user._id+""}`)

const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],

    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction

    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    
    [{ 'align': [] }],
    ['clean']                                         // remove formatting button
];

const options = {
    debug: 'info',
    modules: {toolbar: toolbarOptions},
    placeholder: 'Put your message here',
    theme: 'snow'
}

const editor = new Quill("#editor", options)

// Send the new message
document.querySelector('#sendMessageButton').addEventListener('click', function() {
    const content = editor.root.innerHTML;

    const messageJson = {
        from: user._id,
        to: chat._id,
        content: content
    }
    
    axios.post("/api/message", messageJson)
    .then(function (response) {
        data = response["data"]
        if (data.error == undefined) {
            console.log("Message sent")
            console.log(data)
        } else {
            console.log(data)
        }
    })
    .catch(function (err) {
        console.log(err);
    })
});

const messagesPromise = axios.get(`/api/chat/${chat._id}/messages`)
const usersPromise = axios.get(`/api/chat/${chat._id}/users`)

// Receive all the new messages
window.onload = async() => {
    const maxHeight = parseInt(window.screen.availHeight * 0.65)
    document.querySelector("#messageContainer").style.maxHeight = `${maxHeight}px`
    
    // Get all existing messages in database
    const messageContainer = document.querySelector("#messageContainer")
    messagesPromise.then((messages)=>{
        console.log(messages)   
        if(!messages.data.error){
            for(let message of messages.data){
                const messageDiv = createMessageElement(message, user)
                messageContainer.appendChild(messageDiv)
            }
        } 
        messageContainer.scrollTop = messageContainer.scrollHeight 

    })

    usersPromise.then((users)=>{
        if(!users.data.error){
            for(let user_ of users.data){
                if(user_._id == user._id){
                    user_.connected = true
                }
                console.log(user_)
                const userContainer = createUserCard(user_)
                document.querySelector("#userCardContainer").appendChild(userContainer)
                
            }
        }
    })

    socket.on("welcome", function() {
        console.log("Connection made");
    })

    socket.on("new message", async function(response){
        const message = response
        if(message.to._id == chat._id){
            const newMessage = createMessageElement(message, user)
            messageContainer.appendChild(newMessage)
            messageContainer.scrollTop = messageContainer.scrollHeight 
        } else {

        }
    })

    //TODO: Create an online event that send an event when a user gets online
    //TODO: Create an event that sends an event when a user disconnects

}