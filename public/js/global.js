// var signaling = 'https://192.168.1.76:3000';
var signaling = 'https://127.0.0.1:3000';
var socket;
var config = {
    'iceServers' : [
        {
            'urls' : 'stun:stun.l.google.com:19302'
        },
        {
            'urls' : 'turn:numb.viagenie.ca:3478',
            'username' : 'kingpin9x@gmail.com',
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

var isHost = false;     // is created room
var isCalled = false;   // is calling
var isInvite = false;   // is invited by someone
var localStream;
var videoTrack;
var audioTrack;

var currentUser;
var peerConnections = {};
var list_user = [];     //list of all users online
var others = [];        //users is not in same room

/* ------- Login ------- */
var loginPage = document.getElementById('loginPage');
var userNameInput = document.getElementById('userNameInput');
var loginBtn = document.getElementById('loginBtn');

/* ------- Main ------- */
var mainPage = document.getElementById('mainPage');
var helloUser = document.getElementById('helloUser');
var userList = document.getElementById('userList');
var otherUsers = document.getElementById('otherUsers');

/* ------- Video ------- */
var videoPage = document.getElementById('videoPage');
var localVideo = document.getElementById('localVideo');
var hangupBtn = document.getElementById('hangupBtn');
var addMemberBtn = document.getElementById('addMemberBtn');
var videoMuteBtn = document.getElementById('videoMuteBtn');
var audioMuteBtn = document.getElementById('audioMuteBtn');

/* ------- Chat ------- */
var textArea = document.getElementById('textArea');
var messageInput = document.getElementById('messageInput');
var sendBtn = document.getElementById('sendBtn');

/* ------- Debug ------- */
var debugBtn = document.getElementById('debugBtn');
var debugPage = document.getElementById('debugPage');
var signalingServer = document.getElementById('signalingServer');
var portSignalingServer = document.getElementById('portSignalingServer');
var hostTurnServer = document.getElementById('hostTurnServer');
var portTurnServer = document.getElementById('portTurnServer');
var userNameServer = document.getElementById('userNameServer');
var passwordServer = document.getElementById('passwordServer');
var hostStunServer = document.getElementById('hostStunServer');
var portStunServer = document.getElementById('portStunServer');
var saveConfigBtn = document.getElementById('saveConfigBtn');
