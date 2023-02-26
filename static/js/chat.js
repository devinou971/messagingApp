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
function sendMessage(){
    const content = editor.root.innerHTML;
    let split_c=content.split(" ")

    if(split_c[0]=="<p>/color_change"){


        

    }else{
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

const messagesPromise = axios.get(`/api/chat/${chat._id}/messages`)
const usersPromise = axios.get(`/api/chat/${chat._id}/users`)

// Receive all the new messages
window.onload = async() => {
    const maxHeight = parseInt(window.screen.availHeight * 0.50)
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

    let popupNumber = 0;

    socket.on("new message", async function(response){
        const message = response
        if(message.to._id == chat._id){
            const newMessage = createMessageElement(message, user)
            messageContainer.appendChild(newMessage)
            messageContainer.scrollTop = messageContainer.scrollHeight 
        } else {
            const popup = document.createElement("div");
            const img = document.createElement("img");
            img.src = "/static/images/messageIcon.png"
            img.width = 20;
            popup.appendChild(img)
            popup.innerHTML += message.to.name;
            popup.classList.add("popup");
            document.querySelector("#popupContainer").appendChild(popup);
            popup.style.top = popupNumber * (popup.offsetHeight + 10) + 40 + "px"
            popupNumber += 1;
            setTimeout( ()=> {
                popup.classList.add("hidden");
                setTimeout(() => {
                    popup.remove();
                    popupNumber -= 1;
                }, 1000)
            }, 2000 )
        }
    })
}