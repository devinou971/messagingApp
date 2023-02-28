
// If the user if not connected, we go back to the first page
const user = JSON.parse(sessionStorage.getItem("user"))
if(!user){
    window.location.replace("/connexion")
}

const socket = io(`${socketHost}?userid=${user._id+""}`)
socket.on("welcome", function() {
    console.log("Connection made");
})

// Quill wysiwyg configuration
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

// Quill input creation
const editor = new Quill("#editor", options)

// Sends a new message
function sendMessage(){
    const content = editor.root.innerHTML;
    let split_c=content.split(" ")

    if(split_c[0]!="<p>/color_change"){
        const messageJson = {
            from: user._id,
            to: chat._id,
            content:content
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
           
    }
  
}

// Invites a user in the current chat
async function inviteUser(){
    const userpseudo = document.querySelector("#pseudo").value;
    const responseUser = await axios.get("/api/find/user/" + userpseudo);
    if(responseUser.data.error){
        alert(responseUser.data.error);
    } else {
        const responseInvite = await axios.put(`/api/user/${responseUser.data._id}/chat/${chat._id}`);
        if(responseInvite.data.error){
            alert(responseInvite.data.error)
        } else {
            window.location.reload();
        }
    }
}

// We load the promises to the messages and users, 
// but we don't do anything before the page is loaded
const messagesPromise = axios.get(`/api/chat/${chat._id}/messages`)
const usersPromise = axios.get(`/api/chat/${chat._id}/users`)

window.onload = async() => {
    const maxHeight = parseInt(window.screen.availHeight * 0.50)
    document.querySelector("#messageContainer").style.maxHeight = `${maxHeight}px`
    
    // Get all existing messages and display them
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

    // Get all the users of the chat and display them
    usersPromise.then((users)=>{
        if(!users.data.error){
            for(let user_ of users.data){
                if(user_._id == user._id){
                    user_.connected = true
                }
                const userContainer = createUserCard(user_)
                document.querySelector("#userCardContainer").appendChild(userContainer)                
            }
        }
    })

    // When we receive a message that is not from the current
    // chat, this variable will be useful

    socket.on("new message", async function(response){
        const message = response
        if(message.to._id == chat._id){
            const newMessage = createMessageElement(message, user)
            messageContainer.appendChild(newMessage)
            messageContainer.scrollTop = messageContainer.scrollHeight 
        } else {
            // If the message comes from another chat, we create a popup 
            createPopup(message.to.name)
        }
    })
}