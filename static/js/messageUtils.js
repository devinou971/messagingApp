function createMessageElement(message, user){
    const htmlContent = message.content

    let messageContainer = null
    if(message.from._id == user._id){
        const messageTemplate = document.querySelector("template#messageSentTemplate")
        messageContainer = messageTemplate.content.cloneNode(true) 
    } else {
        const messageTemplate = document.querySelector("template#messageReceivedTemplate")
        messageContainer = messageTemplate.content.cloneNode(true) 
    }
    
    messageContainer.querySelector(".message-text").innerHTML = htmlContent
    const date = new Date(message.timestamp)
    const dateString = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const timeString = date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageContainer.querySelector(".time").innerHTML = `Envoyé le ${dateString} à ${timeString}`
    messageContainer.querySelector(".user-name").innerHTML = message.from.pseudo + message.from.specialId

    if(message.from.profilePicture){
        messageContainer.querySelector(".profile-picture").src = "/static/images/" + message.from.profilePicture
    }

    return messageContainer
}


function createUserCard(user){
    
    const userTemplate = document.querySelector("template#userCardTemplate")
    
    const userContainer = userTemplate.content.cloneNode(true) 
    const userLink = userContainer.querySelector(".user-name").querySelector("a")
    userLink.innerHTML = user.pseudo + user.specialId
    userLink.href = `/user/${user.pseudo + user.specialId}`

    if(user.profilePicture){
        userContainer.querySelector(".profile-picture").src = "/static/images/" + user.profilePicture
    }

    const div = userContainer.querySelector(".justify-content-start")

    if(user.connected){
        // div.classList.add("connected")
    } else {
        div.classList.add("disconnected")
    }

    return userContainer
}

let popupNumber = 0;

function createPopup(chatName){
    const popup = document.createElement("div");
    const img = document.createElement("img");
    img.src = "/static/images/messageIcon.png"
    img.width = 20;
    popup.appendChild(img)
    popup.innerHTML += chatName;
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