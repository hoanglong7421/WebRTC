signalingServer.value = '127.0.0.1';
portSignalingServer.value = '3000';
hostTurnServer.value = 'numb.viagenie.ca';
portTurnServer.value = '3478';
userNameServer.value = 'kingpin9x@gmail.com';
passwordServer.value = '123456';
hostStunServer.value = 'stun.l.google.com';
portStunServer.value = '19302';

debugBtn.addEventListener("click", function(event) {
   displayPage(loginPage, false);
   displayPage(debugPage, true);
});

saveConfigBtn.addEventListener("click", function(event) {
   if(signalingServer.value != "" && portSignalingServer.value != "") {
      signaling = "https://" + signalingServer.value + ":" + portSignalingServer.value;
      console.log("Save signaling server success");
   }

   if(hostTurnServer.value != "" && 
      portTurnServer.value != "" && 
      userNameServer.value != "" && 
      passwordServer.value != "") 
   {
      config.iceServers[1].urls = "turn:" + hostTurnServer.value + ":" + portTurnServer.value;
      config.iceServers[1].username  = userNameServer.value;
      config.iceServers[1].credential = passwordServer.value;
      console.log("Save turn server success");
   }

   if(hostStunServer.value != "" && portStunServer != "") {
      config.iceServers[0].urls = "stun:" + hostStunServer.value + ":" + portStunServer.value;
      console.log("Save stun server success");
   }

   displayPage(loginPage, true);
   displayPage(debugPage, false);
});
