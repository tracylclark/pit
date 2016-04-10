
var mongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("pub"));
var http = require("http");
var server = http.Server(app);
var socketIo = require("socket.io");
var io = socketIo(server);
var db = database;
var numberOfPlayers;
var gameMode = 0; // gameMode 0 is waiting to start, 1 is in game
var ready = 0; //increment on ready message, check for gameReady status
//congruent arrays to track player data 
var sockets = [];
var players = [];
var hands = [];
io.on("connect", function(socket) {
	console.log("socket.io connect made");
	socket.on("disconnect", function() {
		console.log("socket.io disconnect made");
	});
});

var collection = db.collection("users");

//choose deck, populate deck, randomize, deal;

function chooseDeck(){
	var suits = ["nyanCat","sovietBear", "internetz", "rickRoll", "doge", "technoViking", "partyVan", "wat"];
	for(var i = 0; i < numberOfPlayers; i++){
		var cardChooser = Math.floor(Math.random()*suits.length());
		deck[i] = suits[chardChooser];
		suits.splice(cardChooser, 1);
	}
	return suits;
}

function createDeck(){
	var deck = [];
	var suits = chooseDeck();
	for(var i = 0; i < numberOfPlayers; i++){
		for(var j = 0; j < 9; j++){
			deck.push(createCard(suits[i]);
		}
	}
	return deck;
}

//"nyanCat","sovietBear", "internetz", "rickRoll", "doge", "technoViking", "partyVan", "wat"
function createCard(cardName){
	if(cardName == "nyanCat"){
		return var obj = {
			obj.name = "nyanCat";
			obj.points = 100;
		};
	}
	else if(cardName == "sovietBear"){
		return var obj = {
			obj.name = "sovietBear";
			obj.points = 100;
		};
	}
	else if(cardName == "internetz"){
		return var obj = {
			obj.name = "internetz";
			obj.points = 100;
		};
	}
	else if(cardName == "rickRoll"){
		return var obj = {
			obj.name = "rickRoll";
			obj.points = 100;
		};

	else if(cardName == "doge"){
		return var obj = {
			obj.name = "doge";
			obj.points = 100;
		};
	}
	else if(cardName == "technoViking"){
		return var obj = {
			obj.name = "technoViking";
			obj.points = 100;
		};
	}
	else if(cardName == "partyVan"){
		return var obj = {
			obj.name = "partyVan";
			obj.points = 100;
		};
	}
	else{//(cardName == "wat")
		return var obj = {
			obj.name = "wat";
			obj.points = 100;
		};
	}

}


function shuffleDeck(){
	var deck = createDeck();
	var playDeck;
	var deckLength = deck.length();
	for(var i =0; i < deckLength; i++){
		var tmp = Math.floor(Math.random()*deck.length());
		playDeck[i] = deck[tmp];
		deck.splice(tmp, 1);
	}
	return playDeck;

}

//ready player, call shuffleDeck and deal deck

function dealDeck(){ 
	if (gameMode == 1) {
		var deck = shuffleDeck();
		for(var i = 0; i < numberOfPlayers; i++){
			for(var j = 0; j < 9; j++){
				hands[i].push(deck.splice(0,1));
			}
		}
	}
}

//sit player
//auto-sit players in seats
//for spectators either don't allow or once all seats are full they can spectate
function sitPlayer(){
	if (sockets.length()==8)  {return;} //cannot have more than 8 players
	sockets.push(socket);
	players.push(userObj); //once they log in a user object is created and pushed w/ their
	//socket to the array
}

// ready game
function readyToPlay(){
	if (sockets.length()>=3 && ready>(Math.floor(0.5*sockets.length())) return true;
	return false;
	//check status, change game mode
	//if more than half of currently connected people click ready
	//must be at least 3 people --- return false if its not
	//cannot be more than 8 players --
}


//check game win



//check round win



//corner


io.on("connection", function(socket) {
	console.log("Somebody connected to our socket.io server :)");

	socket.on("disconnect", function() { //need to change game mode on disconnect if a player
		console.log("They probably closed their web browser or went to a different page :(");

		var indexOfUser = allSockets.indexOf(socket);
		allSockets.splice(indexOfUser, 1); //index to remove at, how many elements to remove.
		allUsernames.splice(indexOfUser, 1); //index to remove at, how many elements to remove.
		
		io.emit("updateUserList", allUsernames);
	});

	socket.on("login", function(username, password, message) {
		//query the database 
		//if message == login && user / pw matches user record allow login : login = true;
		//else if message == create && user doesn't exist
			//add to DB and allow login : login = true; 
		//else return error for invalidity : return login = false;
		//add to player list (unless too large, then spectator)
			//emit invalid or emit valid

		io.emit("loginValidation", msg); //msg is a bool, if true it hides false invalid msg
		//pass the user objects on game update (when events occur)
	});

	
	socket.on("updateGUI", function(msg) {
		//if gameMode == 0
		//else if GM == 1
		//...
		//send player objects
		//send hands
		//and so on
		io.emit("updateGUI", function(msg));
	});

});

server.listen(80);
console.log("Server is listening on port 80");

