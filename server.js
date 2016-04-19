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
var gameMode = 0; // gameMode 0 is waiting to start, 1 is in game, 2 is game over
var ready = 0; //increment on ready message, check for gameReady status
var players = [];
var hands = [];
var collection;
var trades = [];
var specators = [];

//choose deck, populate deck, randomize, deal;
function chooseDeck(){
	var chosenSuits = [];
	var suits = [
		{name : "nyanCat", points : 55},
		{name : "sovietBear", points : 75},
		{name : "internetz", points:  85},
		{name : "rickRoll", points: 60},
		{name : "doge", points: 50},
		{name : "technoViking", points: 65},
		{name : "partyVan", points: 100},
		{name : "wat", points: 80}
	];	
	for(var i = 0; i < numberOfPlayers; i++){
		var cardChooser = Math.floor(Math.random()*suits.length());
		chosenSuits.push(suits[cardChooser]); 
		suits.splice(cardChooser, 1);
	}
	return chosenSuits;
}
function createDeck(){ //we call create deck, a random list of suits is created using chooseDeck() 
	var deck = []; //we then populate a deck with card objects
	var chosenSuits = chooseDeck();
	for(var i = 0; i < numberOfPlayers; i++){
		for(var j = 0; j < 9; j++){
			deck.push(chosenSuits[i]);
		}
	}
	return deck;
}
function shuffleDeck(){
	var deck = createDeck();
	var playDeck;
	while(deck.length()){ //runs until the array is empty
		var choose = Math.floor(Math.random()*deck.length());
		playDeck.push(deck[choose]);
		deck.splice(choose, 1);
	}
	return playDeck;
}

function dealDeck(){
	hands = []; //wipe out everyone's hands on restart
	var deck = shuffleDeck();
	for(var i = 0; i < numberOfPlayers; i++){
		hands[i] = []; //create their hand as an empty array
		for(var j = 0; j < 9; j++){
  			hands[i].push(deck.splice(0,1)); //give each player nine cards
		}
	}
}

function sitPlayer(userObj){ //this is called on a successful login
	if (players.length()>8)  {
		spectators.push(userObj);
	} 
	else {
		players.push(userObj); 
	}
	updateGameState();
}

function readyToPlay(){
	return (players.length()>=3 && ready>(Math.floor(0.5*players.length())));
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

function loginValidation(db, userName, passWord, msg, socket, callback) {
	var collection = db.collection("users");
	collection.find({username: userName}).toArray(function(err, docs) {
		if (err != null) {
			console.log("ERR on attempting to find..." + err);
			callback(null);
		}
		else {
			callback(docs);
		}
	});
}

function createUser(db, userName, passWord, socket, callback){ //if null and msg==create createUser
	var collection = db.collection("users");
	collection.insertOne({username : userName, password: passWord, wins: 0, losses: 0}, function(err, result){
		if (err!=null){
			if //can't have over 8 players BUT we need to sit them... and create user obj -- also spectators need obj too >.<
			players[getUserIndex(socket)]={username:userName, score:0, wins:0, losses: 0};
			callback(result);
		} 
		else callback(null);
	});
	
}
function getUserIndex(socket){
	for(var i = 0; i<allSocket.length(); i++){
		if (sockets[i]==socket) return i;
	}
}
function loginUser(db, userName, passWord, socket, callback){
	var collection = db.collection("users");
	if(collection.find({username: userName, password: passWord}).toArray(function(err, docs){
		if(err !=null){
			console.log("Error on login trying to find " + err);
			callback(null);
		}
		else{
			callback(docs);
		}
	});
}
//may actually want a loop in the main function that does this and calls it that many times instead of inside of here?
function updateScores(db, callback){ //to get looked at
	var collection = db.collection("users");
	for (var i = 0; i<players.length(); i++){
		if (players[i].score>=500) {
			collection.updateMany({username: players[i].username, wins: players[i].wins }, function(err, result) {
				if (err != null) {
					console.log("ERR on attempting to update..." + err);
					callback(null); //"returning" null means we are telling the caller it didn't work.
				}
				else {
					console.log("update() succeeded.  # of documents modified: " + result.result.n);
					callback(result); //here we indicate success by returning the result object.
				}
			});

		}
		else{ //increment losses
			collection.updateMany({username: players[i].username, losses: players[i].losses }, function(err, result) {
				if (err != null) {
					console.log("ERR on attempting to update..." + err);
					callback(null); 
				}
				else {
					console.log("update() succeeded.  # of documents modified: " + result.result.n);
					callback(result); 
				}
			});
		}	
	}
}

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
	if(offeredCards.length() <= acceptCards.length()); //if a person accepts an offer they have to have equal or more cards than the offer
	//you can choose to trade less cards than you are offering, you can't make someone else do it
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

io.on("connect", function(socket) { //was "connection"
	console.log("Somebody connected to our socket.io server");

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
	socket.on("ready", function(socket){
		ready+=1;
		if(readyToPlay()){
			dealDeck();
			updateGameState();
		}
	});

	socket.on("login", function(obj) { 
		un = obj.username;
		pw = obj.password;
		msg = obj.message;
		//msg is whether they wanted to login or create a user
		//if the callback didn't work, it's null, so we return false
		//otherwise we emit true after all conditions for creation/login are met
		loginValidation(db, un, pw, msg, socket, function(result){
			if (result != null && msg=="login"){
				//use the db to check password for login
				loginUser(db, un, pw, socket, function(result){
					if(result!=null) io.emit("loginValidation", true);
					else io.emit("loginValidation, false");
				});
				
			} 
			else if (result == null && msg=="create"){
				//use the db to create a user
				createUser(db, un, pw, socket, function(result){
					if(result!=null) io.emit("loginValidation", true); 
					else io.emit("loginValidation", false); //create didn't succeed
				});
			} 
			else{
				io.emit("loginValidation", false); //couldn't login, couldn't create
			} 
		});

		updateGameState();
		
		//add to player list (unless too large, then spectator)
		

		// io.emit("loginValidation", msg); 
		//pass the user objects on game update (when events occur)
	});

	
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
			updateScores(db, function(result){
				//not sure if this will work, i have to update ALL the scores but don't have a filter for the db, so using a for loop currently
				if (result==null) console.log(); //log whose data wasn't updated (manually change if error??)
			});
			io.emit("gameWin", msg); //msg is who won
		}
		else if (round){
			//msg is round winner, increment score, change gameMode to redeal WHICH GAME MODE DOES THIS!!!
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

mongoClient.connect("mongodb://localhost:27017", function(err, database) {
	if (err) throw err;
	db = database;
	collection = db.collection("users");
	console.log("We connected to Mongo");

	server.listen(80, function() {console.log("Server is ready");})
});