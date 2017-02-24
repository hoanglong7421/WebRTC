messageInput.addEventListener("keyup", function(event) {
   event.preventDefault();
   if(event.keyCode == 13) {
      sendBtn.click();
   }
});

sendBtn.addEventListener("click", function(event) {
   var message = messageInput.value;
   if(message !== "") {
      textArea.innerHTML += "<b>" + currentUser + "</b>: " + message + "<br/>";
      textArea.scrollTop = textArea.scrollHeight;
      var data = {
         message: message,
         from: currentUser
      }
      for(var member in peerConnections) {
         var channel = peerConnections[member][1];
         channel.send(JSON.stringify(data));
      }
      messageInput.value = "";
   }
});

function setChannelEvents(channel) {
   channel.onopen = function() {
         console.log('Data Channel is open');
   };
   channel.onerror = errorLog;
   channel.onmessage = handleDataChannelMessage;
};

function handleDataChannelMessage(event) {
   data = JSON.parse(event.data);
   textArea.innerHTML += "<b>" + data.from + "</b>: " + data.message + "<br/>";
   textArea.scrollTop = textArea.scrollHeight; 
};