/*
Tracy Clark
Ben Slater
CS 365 
Group Project: Pit
*/
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
var gameMode = 0; // gameMode 0 is waiting to start, 1 is in game, 2 is game over 
var ready = 0; //increment on ready message, check for gameReady status
var players = [];
var hands = [];
var collection;
var trades = [[],[],[],[],[],[],[],[]];
var spectators = [];

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
	for(var i = 0; i < players.length; i++){
		var cardChooser = Math.floor(Math.random()*suits.length);
		chosenSuits.push(suits[cardChooser]); 
		suits.splice(cardChooser, 1);
	}
	return chosenSuits;
}
function createDeck(){ //we call create deck, a random list of suits is created using chooseDeck() 
	var deck = []; //we then populate a deck with card objects
	var chosenSuits = chooseDeck();
	for(var i = 0; i < players.length; i++){
		for(var j = 0; j < 9; j++){
			deck.push(chosenSuits[i]);
		}
	}
	return deck;
}
function shuffleDeck(){
	var deck = createDeck();
	var playDeck = [];
	while(deck.length){ 
		var choose = Math.floor(Math.random()*deck.length);
		playDeck.push(deck[choose]);
		deck.splice(choose, 1);
	} //runs until the array is empty
	return playDeck;
}

function dealDeck(){
	hands = []; //wipe out everyone's hands on restart
	var deck = shuffleDeck();
	for(var i = 0; i < players.length; i++){
		hands[i] = []; //create their hand as an empty array
		for(var j = 0; j < 9; j++){
  			hands[i].push(deck.splice(0,1)[0]); //give each player nine cards
		}
	}
}

function sitPlayer(userObj){ //this is called on a successful login
	if (players.length>8)  {
		spectators.push(userObj);
	} 
	else {
		players.push(userObj); 
	}
	updateGameState();
}

function readyToPlay(){
	return (players.length>=3 && ready>(Math.floor(0.5*players.length)));
}

function checkForRoundWin(playerIndex){
	if (gameMode==1){
		var card = hands[playerIndex][0].name;
		for (var i = 1; i<hands[playerIndex].length; i++){
			if (hands[playerIndex][i].name!=card) return false;
		}
		return true;
	}
}

function checkForGameWin(playerIndex){
	if (gameMode==1){
		if (players[playerIndex].score>=500){
		//if (players[playerIndex].score>=50){ test/demo quickplay
			return true;
		}
		return false;
	}
}

function userQuery(db, userName, callback) {
	var collection = db.collection("users");
	collection.find({username: userName}).toArray(function(err, docs) {
		if (err != null) {
			console.log("Error on attempting to find: " + err);
			callback("error"); //error on trying to query the db
		}
		else callback(docs); //the docs object is null if the name doesn't exist
	});
}

function createUser(db, userName, passWord, callback){ //we don't have to check for uniqueness in UN here 
	var collection = db.collection("users");
	collection.insertOne({username : userName, password: passWord, wins: 0, losses: 0}, function(err, result){
		if (err!=null) callback("error");
		else callback(result);
	});
}

function updateScores(db){ 
	var collection = db.collection("users");
	for (var i = 0; i<players.length; i++){
			collection.update({username: players[i].name}, {$set: { wins: players[i].wins, losses: players[i].losses}});
	}
}

function validTradeOffer(playerIndex, cardIndexes){
	if (cardIndexes.length>4 || cardIndexes.length<1 || !cardIndexes) return false; //can't trade more than 4 cards per rules
 	var cardSuit=hands[playerIndex][cardIndexes[0]].name;     //example card:  {name : "wat", points: 80}
	for (var i = 1; i<cardIndexes.length; i++){
		if (hands[playerIndex][cardIndexes[i]].name != cardSuit) return false; //validate all cards are the same
	}
	trades[playerIndex]=cardIndexes; //trigger trade push to clients
	return true;
}

function acceptTrade (offeredPlayerIndex, acceptedPlayerIndex, acceptedCards){ 
	//if players are in accept trade then BOTH of them have been through validTrade()
	var offeredCards = trades[offeredPlayerIndex];
	if(offeredCards.length <= acceptedCards.length){ 
	//if a person accepts an offer they have to have equal or more cards than the offer
	//you can choose to trade less cards than you are offering, you can't make someone else do it
	//someone can accept a trade for less cards than they are offering, it just cuts some of the cards off
		trade(offeredPlayerIndex, offeredCards, acceptedPlayerIndex, acceptedCards);
	}
}
function trade(index1, cards1, index2, cards2){
	for(var i = 0; i<cards1.length; i++){
		var tmp = hands[index1][cards1[i]]; //store player 1 card
		hands[index1][cards1[i]]=hands[index2][cards2[i]]; //make player 1 card = player 2
		hands[index2][cards2[i]] = tmp; //make player 2 = stored player 1 original card
	}
	trades[index1] = [];
	trades[index2] = [];
}

function updateGameState(){
	var gameState = {};
	var playersToSend = [];
	var spectatorsToSend = [];
	for(var i=0; i<players.length; i++){
		playersToSend[i] ={
			name: players[i].name,
			wins: players[i].wins,
			losses: players[i].losses, 
			score: players[i].score
		};
	}
	for(i=0; i<spectators.length; i++){
		spectatorsToSend[i] = {
			name: spectators[i].name
		};
	}
	gameState.players = playersToSend; //this is the player objects
	gameState.trades = trades; //if there are trades available needs to be shown
	gameState.spectators = spectatorsToSend;
	gameState.gameMode = gameMode;
	for(var i = 0; i<players.length; i++){
		gameState.hand = hands[i];
		players[i].socket.emit("updateGameState", gameState);
	}
	//ignore spectators for now
}

io.on("connect", function(socket) { 
	console.log("Somebody connected to server");

	function getPlayerIndexBySocket(socket){
		return players.map(function(e) { return e.socket; }).indexOf(socket);
	}
	function getPlayerIndexByName(name){
		return players.map(function(e) { return e.name; }).indexOf(name);
	}
  
	socket.on("disconnect", function() {
		var indexOfUser = spectators.map(function(e) { return e.socket; }).indexOf(socket);
		if (indexOfUser!=-1){
			console.log("A spectator left.");
			spectators.splice(indexOfUser, 1); //index to remove at, how many elements to remove.
		}
		else{
			indexOfUser = getPlayerIndexBySocket(socket);
			if (indexOfUser!=-1){
				console.log("A player left.");
				if(players[indexOfUser].ready) ready--;
				players.splice(indexOfUser, 1);
				if (gameMode==1){
					trades = [[],[],[],[],[],[],[],[]];
					hands = [];
					for(var i = 0; i<players.length; i++){
						players[i].ready = false;
						players[i].score = 0;
					}
					ready = 0;
					gameMode = 2; //game over if a player leaves during play
					io.emit("gameOver"); //send a gameOver message to everyone
					updateGameState();
				} 
			}
		}
		updateGameState();
	});

	socket.on("login", function(credentials) { 
		//if the db errored trying to check / create / login didn't work return false
		//otherwise we emit true after all conditions for creation/login are met
		userQuery(db, credentials.username, function(result){
			if (result == "error"){
				socket.emit("loginValidation", false);
				return; 
			}
			if (result.length>0 && credentials.message=="login"){
				var indexOfUser = getPlayerIndexByName(credentials.username);
				if (indexOfUser!=-1) {
					socket.emit("loginValidation", false);
				}
				else if (credentials.password == result[0].password){
					if (players.length<=8 && gameMode!=1){
						players.push({name: credentials.username, socket: socket, wins: result[0].wins, losses: result[0].losses, score: 0, ready: false});
					}
					else{ //don't need wins, losses, or score for spectators
						spectators.push({name: credentials.username, socket: socket}); 
					}
					socket.emit("loginValidation", true);
					updateGameState();
				}
				else {
					socket.emit("loginValidation", false);
				}
			}
			else if (result.length==0 && credentials.message=="create"){
				//use the db to create a user
				createUser(db, credentials.username, credentials.password, function(result){
					if(result.length!=0 && result!="error"){ 
						if (players.length<=8 && gameMode!=1) players.push({name: credentials.username, socket: socket, wins: 0, losses: 0, score: 0, ready: false});
						else spectators.push({name: credentials.username, socket: socket});
						console.log("Create was successful.");
						socket.emit("loginValidation", true); 
						updateGameState();
					} 
					else socket.emit("loginValidation", false); //create didn't succeed
				});
			} 
			else{
				socket.emit("loginValidation", false); //couldn't login, couldn't create
			} 
		});
		updateGameState();
	});
  
	socket.on("ready", function(){
		var indexOfPlayer = getPlayerIndexBySocket(socket);
		if(!players[indexOfPlayer].ready){
			players[indexOfPlayer].ready = true;
			ready+=1;
			if(readyToPlay()){
				gameMode = 1;
				dealDeck();
				updateGameState();
			}
		}
	});
  
	socket.on("trade", function(cards){
		var indexOfUser = getPlayerIndexBySocket(socket);
		var valid = validTradeOffer(indexOfUser, cards);
		updateGameState();
	});

	socket.on("acceptTrade", function(msg){
	var indexOfUser = getPlayerIndexBySocket(socket);
		var valid = validTradeOffer(indexOfUser, msg.cards);
		if (valid){
			acceptTrade(msg.offeredPlayerIndex, indexOfUser, msg.cards); //cards here belong to player 2
		}
		updateGameState();
	});

	socket.on("corner", function(){
		var game = false;
		var playerIndex = getPlayerIndexBySocket(socket); 
		if (playerIndex == -1) return; //whoever clicked wasn't a player
		var round = checkForRoundWin(playerIndex);
		if (round){
			trades = [[],[],[],[],[],[],[],[]];
			players[playerIndex].score += hands[playerIndex][0].points; //increment their score based on their first card
			game = checkForGameWin(playerIndex); //check to see if the game is over
			if (game){
				for(var i = 0; i<players.length; i++){
					if (i==playerIndex) players[i].wins++;
					else players[i].losses++;
					players[i].ready = false;
					players[i].score = 0;
				}
				gameMode = 2;
				ready = 0;
				hands = [];
				updateScores(db);
				updateGameState();
				io.emit("gameWin", players[playerIndex].name); //msg is who won
			}
			else{
				dealDeck();
				io.emit("roundWin", players[playerIndex].name);
			}
		}
		updateGameState();
	});
});

mongoClient.connect("mongodb://localhost:27017/pit", function(err, database) {
	if (err) throw err;
	db = database;
	collection = db.collection("users");
	console.log("We connected to Mongo");

	server.listen(80, function() {console.log("Server is ready");})
});