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

    messageContainer.querySelector(".time").innerHTML = `Sent on ${dateString} at ${timeString}`
    messageContainer.querySelector(".user-name").innerHTML = message.from.pseudo + message.from.specialId

    if(message.from.profilePicture){
        messageContainer.querySelector(".profile-picture").src = "/static/images/" + message.from.profilePicture
    }

    return messageContainer
}


function createUserCard(user){
    const userTemplate = document.querySelector("template#userCardTemplate")
    
    const userContainer = userTemplate.content.cloneNode(true) 
    userContainer.querySelector(".user-name").innerHTML = user.pseudo + user.specialId

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