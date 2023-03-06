const socket = io()
//Elements
const $messageForm = document.querySelector("#message-form"); 
const $messageInput = $messageForm.querySelector("input"); 
const $messageButton = $messageForm.querySelector("button") 
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
//Templates 
const messageTemplate = document.querySelector("#message-template") 
const locationTemplate = document.querySelector("#location-template")
const sidebarTemplate = document.querySelector("#sidebar-template")

const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix : true})

const autoscroll = ()=>{
    // New message Height
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset =  $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight < scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on("locationMessage",(locationMessage)=>{
    // console.log(locationMessage);
    const html = Mustache.render(locationTemplate.innerHTML,{
        username: locationMessage.username,
        url : locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML("beforeend",html)
    autoscroll()
})

socket.on("message",(msg)=>{
    // console.log(msg);  
    const html = Mustache.render(messageTemplate.innerHTML,{
        username : msg.username,
        message:msg.text,
        createdAt : moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML("beforeend",html)
    autoscroll()
})

$messageForm.addEventListener("submit",(e)=>{ 
    e.preventDefault();
    // disable the input and send button 
    $messageButton.setAttribute("disabled","disabled");
    $messageInput.setAttribute("disabled","disabled")

    const message = e.target.elements.message.value;
    socket.emit("sendMessage",message,(error)=>{
        // enabling the input and send button after completing the request so that 
        //if process takes time user can't send same request multiple times to avoid repetition 
        $messageButton.removeAttribute("disabled")
        $messageInput.removeAttribute("disabled")
        $messageInput.value = '';
        $messageInput.focus();

        if(error){
            alert(error)
            return;
            // return  console.log(error);
        }
        // console.log("The message is delivered!");
    })
})

document.querySelector("#send-location").addEventListener("click",()=>{
    $sendLocationButton.setAttribute("disabled","disabled");

    if(!navigator.geolocation){
        return alert("Navigatior is not supported by your browser.")
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        // console.log(position);
        socket.emit('sendLocation',{
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute("disabled");
            // console.log("Your location is delivered successfully");
        })
    })
})

socket.emit("join",{username,room},(error)=>{
    if(error){
        alert(error);
        location.href = '/'
    }
});

socket.on("roomData",({room,users})=>{
    const html = Mustache.render(sidebarTemplate.innerHTML,{
        room,
        users
    });
    document.querySelector("#room-data").innerHTML = html;
})