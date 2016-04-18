var allUsernames = []; //this is everyone connected including spectators
var allSockets = []; //the socket of everyone connected to the server, including spectators
//we autosit the first 8 people to join, so we need to add those people to both arrays (allUN & players)
//and we need to assign to allUN no matter what
var mongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
var http = require("http");
var server = http.Server(app);
var socketIo = require("socket.io");
var io = socketIo(server);
app.use(express.static("pub"));
var db;
var numberOfPlayers;
var gameMode = 0; // gameMode 0 is waiting to start, 1 is in game
var ready = 0; //increment on ready message, check for gameReady status
//congruent arrays to track player data
var sockets = [];
var players = [];
var hands = [];
var collection;
var trades = [];

io.on("connect", function(socket) {
	console.log("socket.io connect made");
	socket.on("disconnect", function() {
		console.log("socket.io disconnect made");
	});
});
io.on("ready", function(socket){
	ready+=1;
	if(readyToPlay()){
		dealDeck();
		updateGameState();
	}
});

//choose deck, populate deck, randomize, deal;

function chooseDeck(){
	var suits = ["nyanCat","sovietBear", "internetz", "rickRoll", "doge", "technoViking", "partyVan", "wat"];
	for(var i = 0; i < numberOfPlayers; i++){
		var cardChooser = Math.floor(Math.random()*suits.length());
		deck[i] = suits[cardChooser];
		suits.splice(cardChooser, 1);
	}
	return suits;
}

function createDeck(){
	var deck = [];
	var suits = chooseDeck();
	for(var i = 0; i < numberOfPlayers; i++){
		for(var j = 0; j < 9; j++){
			deck.push(createCard(suits[i]));
		}
	}
	return deck;
}

//"nyanCat","sovietBear", "internetz", "rickRoll", "doge", "technoViking", "partyVan", "wat"
function createCard(cardName){
	if(cardName == "nyanCat"){
		return obj = {
			name : "nyanCat",
			points : 55
		};
	}
	else if(cardName == "sovietBear"){
		return obj = {
			name : "sovietBear",
			points : 75
		};
	}
	else if(cardName == "internetz"){
		return obj = {
			name : "internetz",
			points:  85
		};
	}
	else if(cardName == "rickRoll"){
		return obj = {
			name : "rickRoll",
			points : 60
		};
	}
	else if(cardName == "doge"){
		return obj = {
			name : "doge",
			points : 50
		};
	}
	else if(cardName == "technoViking"){
		return obj = {
			name : "technoViking",
			points : 65
		};
	}
	else if(cardName == "partyVan"){
		return obj = {
			name : "partyVan",
			points : 100
		};
	}
	else{//(cardName == "wat")
		return obj = {
			name : "wat",
			points : 80
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
	allUsernames.push(userObj); //add to all users yay
	allSockets.push(socket);
	if (sockets.length()==8)  {return;} //cannot have more than 8 players
	players.push(userObj); //once they log in a user object is created and pushed w/ their
	//socket to the array
	sockets.push(socket); //this is only the player sockets, not the spectators
	numberOfPlayers = players.length();
	updateGameState();
}

// ready game
function readyToPlay(){
	if (sockets.length()>=3 && ready>(Math.floor(0.5*sockets.length()))) return true;
	return false;
	//check status, change game mode
	//if more than half of currently connected people click ready
	//must be at least 3 people --- return false if its not
	//cannot be more than 8 players --
}



function checkForRoundWin(index){
	if (gameMode==1){
		var card = hands[index][0];
		for (var i = 0; i<hands[index].length(); i++){
			if (hands[index][i]!=card) return false;
		}
		return true;
	}
}

function checkForGameWin(index){
	if (gameMode==1){
		if (player[index].score>=500){
			return true;
		}
		return false;
	}
}

io.on("connection", function(socket) {
	console.log("Somebody connected to our socket.io server :)");

	socket.on("disconnect", function() { //need to change game mode on disconnect if a player
		console.log("Somebody left.");

		var indexOfUser = allSockets.indexOf(socket);
		allSockets.splice(indexOfUser, 1); //index to remove at, how many elements to remove.
		allUsernames.splice(indexOfUser, 1); //index to remove at, how many elements to remove.
		if (indexOfUser<8){
			players.splice(indexOfUser, 1);
			sockets.splice(indexOfUser, 1);
			gameMode = 2; //game over bc we don't have enough players
			//if someone leaves and game has started will have to reset the entire game
		}
		//need to send a gameMode update in case person leaving was a player
		// io.emit("updateUserList", allUsernames);
		updateGameState();
	});

	socket.on("login", function(obj) {
		un = obj.username;
		pw = obj.password;
		msg = obj.message;
		var result = loginValidation(db, un, pw, msg, socket);
		io.emit("loginValidation", result);
		updateGameState();
		//{
			//io.emit("loginValidation", result);
	//	}
		//query the database
		//if message == login && user / pw matches user record allow login : login = true;
		//else if message == create && user doesn't exist
			//add to DB and allow login : login = true;
		//else return error for invalidity : return login = false;
		//add to player list (unless too large, then spectator)
			//emit invalid or emit valid

		// io.emit("loginValidation", msg); //msg is a bool, if true it hides false invalid msg
		//pass the user objects on game update (when events occur)
	});

	function loginValidation(db, userName, passWord, msg, socket) {
		var collection = db.collection("users");
		if (msg=="create"){
			if(collection.find({ userName : { $exists : true} })){
				return false;
			}
		//we want to make sure the username doesn't exist before attempting to add
			collection.insert({username : userName, password: passWord, wins: 0, losses: 0});
			players[socket] = {username : userName, score : 0, wins : 0, losses : 0};
			return true;
		}
		else if (msg=="login"){
			if(collection.find({ userName : { $exists : false} })){
				return false;
			}
			 //need help parsing username

			 //this is hardcoded and needs to be removed
			 players[socket] = {username : userName, score : 0, wins : 0, losses : 0};
			 return true;
		}

	}

	socket.on("trade", function(msg){
		var valid = validTrade(msg.player1, msg.cards);
		io.emit("validTrade", valid);
		updateGameState();
	});
	socket.on("acceptTrade", function(msg){
		var valid = validTrade(msg.player2, msg.cards);
		if (valid){
			acceptTrade(msg.player1, msg.player2, msg.cards); //cards here belong to player 2
		}
		updateGameState();
	});
	socket.on("corner", function(corner, player, gameMode){
		var round = checkForRoundWin();
		var game = false;
		if (round){
			players[player].score += hands[player][0].points;
			game = checkForGameWin();
		}

		//round win && game win
		if (round && game){
			//update db : everyone who isn't the winner gains a loss, winner gains a win
			io.emit("gameWin", msg); //msg is who won
		}
		else if (round){
			//msg is round winner, increment score, change gameMode to redeal
			dealDeck();
			lastRoundWinner = player; //should be a string for player name
			io.emit("roundWin", player);
		}
		else {
			//no win, just keep playing
			io.emit("noWin", msg);
		}
		updateGameState();
	});

});
function validTrade(player, cards){
	var card=hands[whichPlayer][cards[0]].suits;
	if (cards.length()>4) return false; //can't trade more than 4 cards per rules
	var whichPlayer;
	for (var i = 0; i<numberOfPlayers; i++){ //get the correct player
		if(players[i]==player) whichPlayer=i;
	}
	for (var i = 0; i<cards.length(); i++){
		if (hands[whichPlayer][cards[i]].suits != card) return false; //validate all cards are the same
	}
	trades[whichPlayer]=cards;
	return true;
}

function acceptTrade (offeredPlayer, acceptedPlayer, acceptedCards){
	//if players are in accept trade then BOTH of them have been through validTrade()
	var offeredPlayerIndex;
	var acceptedPlayerIndex;
	for (var i = 0; i<numberOfPlayers; i++){ //get the correct player
		if(players[i]==offeredPlayer) offeredPlayerIndex=i;
		if(players[i]==acceptedPlayer) acceptedPlayerIndex=i;
	}
	var offeredCards = trades[offeredPlayerIndex].cards;
	//someone can accept a trade for less cards than they are offering, it just cuts some of the cards off
	trade(offeredPlayerIndex, offeredCards, acceptedPlayerIndex, acceptedCards);
}
function trade(index1, cards1, index2, cards2){
	if (cards1.length()<cards2.length()) var length = cards1.length();
	else var length = cards2.length();
	for(var i = 0; i<cards1.length(); i++){
		var tmp = hands[index1][cards[i]]; //store player 1 card
		hands[index1][cards[i]]=hands[index2][cards[i]]; //make player 1 card = player 2
		hands[index2][cards[i]] = tmp; //make player 2 = stored player 1 original card
	}
}

function updateGameState(){
	var obj = {};
	obj.players = players; //this is the player objects
	obj.trades = trades; //if there are trades available needs to be shown
	obj.allUsernames = allUsernames;
	obj.gameMode = gameMode;
	for(var i = 0; i<numberOfPlayers; i++){
		obj.hand = hands[i];
		io.emit("updateGameState", obj);
	}
	//for now we ignore spectators

}
mongoClient.connect("mongodb://euclid.nmu.edu:27017", function(err, database) {
	if (err) throw err;
	db = database;
	collection = db.collection("users");
	console.log("We connected to Mongo");

	server.listen(80, function() {console.log("Server is ready");})
});
// server.listen(80);
// console.log("Server is listening on port 80");

//ToDo:
//Set up database
//Set up database queries (search for validity/existence)
//Client JS to handle the messages it receives (even a framework would be good for now)

//HTML file
//CSS stylesheet
