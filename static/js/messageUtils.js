function createMessageElement(message, user){
    hiddenEditor.setContents(message.content)
    const htmlContent = hiddenEditor.root.innerHTML

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

    // TODO: Put user images instead of default profile pricture

    return messageContainer
}