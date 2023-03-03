// Creates a Message element to display on the chat page
// @param {Message} message: This is a message object from 
// @param {Element} messageTemplate: The template that we want to complete
// @returns a DOM element to display 
function createMessageElement(message, messageTemplate){
    const htmlContent = message.content

    const messageContainer = messageTemplate.content.cloneNode(true)  
    messageContainer.querySelector(".message-text").innerHTML = htmlContent
    
    // Adding the date and time to the message
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
    
    // Adding the username to the message
    messageContainer.querySelector(".user-name").innerHTML = message.from.pseudo + message.from.specialId

    // Adding the profile picture if it exists
    if(message.from.profilePicture){
        messageContainer.querySelector(".profile-picture").src = "/static/profilePictures/" + message.from.profilePicture
    }

    return messageContainer
}

// Create a card with the user name, 
// the connection status
// @param {User} user: the user object 
// @returns a DOM element that can be added to the chat page
function createUserCard(user){
    // We get the template that we defined in the view
    const userTemplate = document.querySelector("template#userCardTemplate")
    const userContainer = userTemplate.content.cloneNode(true) 

    // Creating a link to go to the user page
    const userLink = userContainer.querySelector(".user-name").querySelector("a")
    userLink.innerHTML = user.pseudo + user.specialId
    userLink.href = `/user/${user.pseudo + user.specialId}`

    // Adding the profile picture if it exists
    if(user.profilePicture){
        userContainer.querySelector(".profile-picture").src = "/static/profilePictures/" + user.profilePicture
    }

    // Putting the card in red if the user is not connected
    const div = userContainer.querySelector(".justify-content-start")
    if(!user.connected){
        div.classList.add("disconnected")
    }

    return userContainer
}

let popupNumber = 0;
// Create a popup to be displayed when a new message is received
// It requires a popup container to be present with the id: popupContainer
// @param {String} chatName: represents the chat the message is coming from
function createPopup(chatName){
    const img = document.createElement("img");
    img.src = "/static/images/messageIcon.png"
    img.width = 20;

    const popup = document.createElement("div");
    popup.appendChild(img);
    popup.innerHTML += chatName;
    popup.classList.add("popup");

    document.querySelector("#popupContainer").appendChild(popup);

    // In order to stack the popups on top of each other, 
    // we use the popNumber
    popup.style.top = popupNumber * (popup.offsetHeight + 10) + 40 + "px"
    popupNumber += 1;
    // We do a little animation to get the popup in and out of frame
    setTimeout( ()=> {
        popup.classList.add("hidden");
        setTimeout(() => {
            popup.remove();
            popupNumber -= 1;
        }, 1000)
    }, 2000 )
}