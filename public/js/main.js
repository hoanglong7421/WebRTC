var signaling = 'https://127.0.0.1:3000';
var socket;
var config = {
   'iceServers' : [
      {
         'urls' : 'stun:stun.l.google.com:19302'
      },
      {
         'urls' : 'turn:numb.viagenie.ca:3478',
         'username' : 'quynhnm.bkit@gmail.com',
         'credential' : '123456'
      }
   ]
};

var constraints = {
  	offerToReceiveAudio: 1,
  	offerToReceiveVideo: 1
};

var isInitiator;
var mRoom;
var mFrom;

var isCalled;
var isInvite;
var localStream;
var videoTrack;
var audioTrack;

var currentUser;
var peerConnections = {};
var list_user = [];//list of all users online
var others = [];//users is not in same room

var loginPage = document.getElementById('loginPage');
var userNameInput = document.getElementById('userNameInput');
var loginBtn = document.getElementById('loginBtn');

var callPage = document.getElementById('callPage');
var helloUser = document.getElementById('helloUser');
var userList = document.getElementById('userList');
var otherUsers = document.getElementById('otherUsers');

var videoPage = document.getElementById('videoPage');
var localVideo = document.getElementById('localVideo');
var hangupBtn = document.getElementById('hangupBtn');
var addMemberBtn = document.getElementById('addMemberBtn');
var videoMuteBtn = document.getElementById('videoMuteBtn');
var audioMuteBtn = document.getElementById('audioMuteBtn');

var textArea = document.getElementById('textArea');
var messageInput = document.getElementById('messageInput');
var sendBtn = document.getElementById('sendBtn');

function resize() {
	var h = window.innerHeight - 100;
	textArea.style.height = h+"px";
}

function displayPage(page, event) {
   if(event) {
      page.style.display = "inherit";
   }
   else {
      page.style.display = "none";
   }
};

function displayUser(list) {
   userList.innerHTML = null;
   for(var i=0; i < list.length; i++) {
      if(currentUser != list[i].username) {
         userList.innerHTML += "<p id=\"user-" + list[i].username + "\">" + list[i].username + " <button class=\"callBtn\">Call</button></p>";
      }
   }
};

//----------------------Login Page----------------------
userNameInput.addEventListener("keyup", function(event) {
   event.preventDefault();
   if (event.keyCode == 13) {
      loginBtn.click();
   }
});

loginBtn.addEventListener("click", function(event) {
   if(userNameInput.value !== "") {
      socket = io(signaling, {'timeout': 8000});
      socketEvent();
      currentUser = userNameInput.value;
      socket.emit('login', currentUser);
   }
});

//----------------------Call Page----------------------
$('.searchUserInput').keyup(function () {
   var inputValue = this.value.toLowerCase();
   if(inputValue == "") {
      $('#userList>p, #otherUsers>p').show();
   } else {
      $('#userList>p, #otherUsers>p').each(function () {
         var text  = $(this).text().toLowerCase();
         text = text.slice(0,-5);
         var match = text.indexOf(inputValue) >= 0 ? $(this).show() : $(this).hide();
      });
   };
});

$('#userList, #addMemberPopup').on('click', '.callBtn', function() {
   $("#addMemberPopup").dialog("close");
   var user = $(this).parent().attr('id');
   var connectedUser = user.slice('5');
   console.log("Call user:", connectedUser);
   isInvite = true;
	socket.emit('createRoom', connectedUser);
});

//----------------------Video Page----------------------
$('#addMemberBtn').on("click", function() {
   getOthers();
   otherUsers.innerHTML = null;
   for(var i=0; i < others.length; i++) {
      if(currentUser !== others[i].username) {
         otherUsers.innerHTML += "<p id=\"user-" + others[i].username + "\">" + others[i].username + " <button class=\"callBtn\">Call</button></p>";
      }
   }
   $("#addMemberPopup").dialog("open");
});

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

videoMuteBtn.addEventListener("click", function(event) {
   videoTrack.enabled = !(videoTrack.enabled);
   if($('#videoMuteBtn').attr("value") == "on") {
      $('#videoImg').attr('src', 'img/cam-off.png');
      $('#videoMuteBtn').attr('value', 'off');
   } else {
      $('#videoImg').attr('src', 'img/cam-on.png');
      $('#videoMuteBtn').attr('value', 'on');
   }
});

audioMuteBtn.addEventListener("click", function(event) {
   audioTrack.enabled = !(audioTrack.enabled);
   if($('#audioMuteBtn').attr("value") == "on") {
      $('#audioImg').attr('src', 'img/mic-off.png');
      $('#audioMuteBtn').attr('value', 'off');
      socket.emit('options', { on: false, type: 2 });
      console.log('turn off mic');
   } else {
      $('#audioImg').attr('src', 'img/mic-on.png');
      $('#audioMuteBtn').attr('value', 'on');
      socket.emit('options', { on: true, type: 2 });
      console.log('turn on mic');
   }
});

hangupBtn.addEventListener("click", function(event) {
   socket.emit('end');
   hangup();
});

//--------------------------------------------
function socketEvent() {
	socket.on('connect_error', function(msg) {
		console.log(msg);
		alert("Connection "+ msg +"!");
		socket.disconnect();
	});

   socket.on('on_login', function(msg) {
      if(!msg.status) {
         alert(msg.error_message + " !");
         socket.disconnect();
      } else {
         helloUser.innerHTML = "Hello " + currentUser;
         list_user = msg.list_user;
         displayUser(list_user);
         displayPage(loginPage, false);
         displayPage(callPage, true);
         console.log("Login success");
      }
   });

   socket.on('on_online', function(msg) {
      var user = msg.user;
      if(msg.status) {
         list_user.push(user);
         userList.innerHTML += "<p id=\"user-" + user.username + "\">" + user.username + " <button class=\"callBtn\">Call</button></p>";
         otherUsers.innerHTML += "<p id=\"user-" + user.username + "\">" + user.username + " <button class=\"callBtn\">Call</button></p>";
      } else {
         list_user = list_user.filter(function (obj) {
            return obj.username !== user.username;
         });
         $("p").remove("#user-" + user.username);
      }
   });

   socket.on('invite', function(data) {
   	if(!isInvite && !isCalled) {
   		isInvite = true;
         console.log("invite:", data);
         $("#confirmPopUp>p").html(data.username + " want to invite you join group " + data.room + ". Answer?");
         $("#confirmPopUp").dialog({
         	buttons: {
		        	"Accept": function() {
		        		isCalled = true;
		            isInvite = false;

		            isInitiator = false;
		            mRoom = data.room;
		            loadStream();
			        	$(this).dialog("close");
	        		},
		        	"Deny": function() {
		        		isInvite = false;
            		socket.emit('reply', {answer: 1, room: data.room});
		          	$(this).dialog("close");
		        	}
  				}
  			});
   		$("#confirmPopUp").dialog("open");
	   } else {
	   	socket.emit('reply', {answer: 2, room: data.room});
	   }
   });

   socket.on('replyToCaller', function(data) {
   	isInvite = false;
      socket.emit('confirm', data.answer);
      var connectedUser = list_user.find(function (obj) {
         return obj.socket == data.from;
      });
      if(data.answer === 0) {
         isCalled = 1;

         isInitiator = true;
         mFrom = data.from;
         if(!localStream) {
         	loadStream();
         } else {
         	afterLoadStream();
         }
      } else if(data.answer === 1) {
         alert(connectedUser.username + ' denied.');
      } else {
         alert(connectedUser.username + ' is busy.');
      }
   });

   socket.on('receiveMessage', function(msg) {
      console.log("[socket.receiveMessage] socket", socket.id);
      console.log("[socket.receiveMessage] msg", msg);
      if(msg.to === '/#' + socket.id) {
         var pc = getPeerConnection(msg.from);
         pc.ondatachannel = function(event) {
            console.log('DataChannel is added ', event);
            var channel = event.channel;
            if(!getChannel(msg.from)) {
               peerConnections[msg.from][1] = channel;
            }
            setChannelEvents(channel);
         };

         if(msg.type === "candidate") {
            pc.addIceCandidate(new RTCIceCandidate(msg.payload));
         } else if(msg.type === "offer") {
            pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            pc.createAnswer()
            .then(function (answer) {
               pc.setLocalDescription(answer);
               sendMessage(msg.from, "answer", answer);
            })
            .catch(errorLog);
         } else if(msg.type === "answer") {
            pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            if($("#audioMuteBtn").attr("value") === "on") {
            	socket.emit("options", { on: true, type: 2 });
            } else {
            	socket.emit("options", { on: false, type: 2 });
            }
         }
      }
   });

   socket.on('listenOptions', function(data) {
   	console.log('listenOptions', data);
      var username;
      for (var member in peerConnections) {
         if(member === data.socket) {
            username = peerConnections[member][2];
            break;
         }
      }
      if(data.type === 2) {
      	if(data.on) {
      		$('#muteIcon-' + username).attr('src', 'img/mic-on.png');
      	} else {
      		$('#muteIcon-' + username).attr('src', 'img/mic-off.png');
      	}
      }
   });

   socket.on('end', function(data) {
   	if(Object.keys(peerConnections).length <= 1) {
   		socket.emit('end');
      	hangup();
   	} else {
   		var user = peerConnections[data.socket][2];
   		var pc = getPeerConnection(data.socket);
   		pc.close();
   		$("#div-"+user).remove();
   		delete peerConnections[data.socket];
   	}
   });
};

function errorLog(error) {
   console.log(error.name + ": " + error.message);
};

function loadStream() {   
   navigator.mediaDevices.getUserMedia({ "audio": true, "video": true })
      .then(gotStream)
      .catch(errorLog);
};

function gotStream(stream) {
   console.log('[gotStream]', stream);
   localVideo.src = window.URL.createObjectURL(stream);
   localStream = stream;

   videoTrack = localStream.getVideoTracks()[0];
   audioTrack = localStream.getAudioTracks()[0];

   afterLoadStream();
};

function afterLoadStream() {
   console.log('[afterLoadStream]');
   if (isInitiator) {
      makeOffer(mFrom);
      displayPage(callPage, false);
      displayPage(videoPage, true);
   } else {
      socket.emit('reply', {answer: 0, room: mRoom});      
      displayPage(callPage, false);
      displayPage(videoPage, true);
   }
}

function getPeerConnection(user) {
   if(peerConnections[user]) {
      return peerConnections[user][0];
   }
   var pc = new RTCPeerConnection(config);
   var channel;
   var curUser = list_user.find(function(obj) {
   	return obj.socket === user;
   });
   peerConnections[user] = [pc, channel, curUser.username];
   pc.addStream(localStream);
   pc.onaddstream = handleRemoteStream;
   pc.onicecandidate = function(event) {
      if(event.candidate) {
         console.log("handleIceCandidate");
         sendMessage(user, "candidate", event.candidate);
      }
   };
   pc.oniceconnectionstatechange = handleIceConnectionStateChange;
   return pc;
};

function getChannel(user) {
   if(peerConnections[user]) {
      return peerConnections[user][1];
   }
};

function getOthers() {
   others = list_user.filter(function(obj) {
      return obj.username !== currentUser;
   });
   for(var member in peerConnections) {
      others = others.filter(function(obj) {
         return obj.socket !== member;
      })
   }
};

function makeOffer(user) {
   var pc = getPeerConnection(user);
   var channel = pc.createDataChannel('RTCDataChannel', {reliable: true});
   peerConnections[user][1] = channel;
   setChannelEvents(channel);

   pc.createOffer(constraints)
   .then(function (offer) {
      console.log("Create offer for ", user);
      pc.setLocalDescription(offer);
      sendMessage(user, "offer", offer);
   })
   .catch(errorLog);
};

function sendMessage(to, type, payload) {
   console.log('[sendMessage]', to, type, payload);
    var msg = {
        type: type,
        payload: payload,
        to: to
    };
    socket.emit('message', msg);
}

function handleIceConnectionStateChange(event) {
   var pc = event.target;
   if(pc.iceConnectionState == 'disconnected' || pc.iceConnectionState == 'failed') {
   	if(Object.keys(peerConnections).length <= 1) {
			socket.emit('end');
		   hangup();
		} else {
   		var connectedUser;
			for(var member in peerConnections) {
				if(peerConnections[member][0] === pc) {
					connectedUser = peerConnections[member][2];
					break;
				}
			}
			$("#div-"+connectedUser).remove();
			pc.close();
			delete peerConnections[member];
		}
   }
};

function handleRemoteStream(event) {
   console.log("Add remote stream", event);
   var connectedUser;
   for(var member in peerConnections) {
		if(peerConnections[member][0] === event.target) {
			connectedUser = peerConnections[member][2];
			break;
		}
	}
	var div = $('<div />', {
		class: 'remoteDiv',
		id: 'div-' + connectedUser
	});
	div.appendTo($('#videoArea'));
   var video = $('<video />', {
      class: 'remoteVideo',
      id: 'video-' + connectedUser,
      src: window.URL.createObjectURL(event.stream),
      autoplay: true
   });
   video.appendTo($('#div-' + connectedUser));
   var muteIcon = $('<img />', {
   	class: 'muteIcon',
   	id: 'muteIcon-' + connectedUser,
   	src: 'img/mic-on.png'
   });
   muteIcon.appendTo($('#div-' + connectedUser));
};

function hangup() {
   for(var member in peerConnections) {
      var pc = peerConnections[member][0];
      pc.close();
      delete peerConnections[member];
   }
   if(videoTrack) {videoTrack.stop();}
   if(audioTrack) {audioTrack.stop();}
   //reset default values
   isCalled = false;
   localStream = null;
   textArea.innerHTML = null;
   $("#videoMuteBtn").attr('value','on');
   $("#videoImg").attr('src','img/cam-on.png');
   $("#audioMuteBtn").attr('value','on');
   $("#audioImg").attr('src','img/mic-on.png');
   localVideo.src = null;
   $('.remoteDiv').remove();

   displayPage(callPage, true);
   displayPage(videoPage, false);
};
//Chat text
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