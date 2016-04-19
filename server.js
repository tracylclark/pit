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
// var numberOfPlayers;
var gameMode = 0; // gameMode 0 is waiting to start, 1 is in game, 2 is game over
var ready = 0; //increment on ready message, check for gameReady status
var players = [];
var hands = [];
var collection;
var trades = [];
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

function checkForRoundWin(playerIndex){
	if (gameMode==1){
		var card = hands[playerIndex][0].name;
		for (var i = 1; i<hands[playerIndex].length(); i++){
			if (hands[playerIndex][i].name!=card) return false;
		}
		return true;
	}
}

function checkForGameWin(playerIndex){
	if (gameMode==1){
		if (player[playerIndex].score>=500){
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

function loginUser(db, userName, passWord, callback){ //could make this much leaner, leaving it for now
	var collection = db.collection("users");
	collection.find({username: userName, password: passWord}).toArray(function(err, docs){
		if(err !=null){
			console.log("Error on login trying to find " + err);
			callback("error");
		}
		else{
			for (var i = 0; i<players.length(); i++){
				if (userName==players[i].name) callback(null); //can't have someone try to log into the same account twice
			} //doublecheck this works
			callback(docs); //returns null if no un / pw combination that matches	
		} 
	});
}

//may actually want a loop in the main function that does this and calls it that many times instead of inside of here?
function updateScores(db, callback){ //to get looked at
	var collection = db.collection("users");
	for (var i = 0; i<players.length(); i++){
			collection.updateMany({username: players[i].username, wins: players[i].wins, losses: players[i].losses}, function(err, result) {
				if (err != null) {
					console.log("Error on attempting to update..." + err);
					callback("error"); //"returning" null means we are telling the caller it didn't work.
				}
				else {
					console.log("update() succeeded.  # of documents modified: " + result.result.n);
					callback(result); //here we indicate success by returning the result object.
				}
			});
	}
}

function validTradeOffer(playerName, cardIndexes){
	if (cards.length()>4) return false; //can't trade more than 4 cards per rules
	var whichPlayer;
	for (var i = 0; i<numberOfPlayers; i++){ //get the correct player
		if(players[i].name==playerName) whichPlayer=i;
	}
 	var cardSuit=hands[whichPlayer][cardsIndexes[0]].name;     //example card:  {name : "wat", points: 80}
	for (var i = 1; i<cardIndexes.length(); i++){
		if (hands[whichPlayer][cards[i]].name != cardSuit) return false; //validate all cards are the same
	}
	trades[whichPlayer]=cardIndexes; //trigger trade push to clients
	return true;
}

function acceptTrade (offeredPlayerName, acceptedPlayerName, acceptedCards){
	//if players are in accept trade then BOTH of them have been through validTrade()
	var offeredPlayerIndex;
	var acceptedPlayerIndex;
	for (var i = 0; i<numberOfPlayers; i++){ //get the correct player
		if(players[i]==offeredPlayerName) offeredPlayerIndex=i;
		if(players[i]==acceptedPlayerName) acceptedPlayerIndex=i;
	}
	var offeredCards = trades[offeredPlayerIndex];
	if(offeredCards.length() <= acceptCards.length()){ //if a person accepts an offer they have to have equal or more cards than the offer
	//you can choose to trade less cards than you are offering, you can't make someone else do it
	//someone can accept a trade for less cards than they are offering, it just cuts some of the cards off
		trade(offeredPlayerIndex, offeredCards, acceptedPlayerIndex, acceptedCards);
	}
}
function trade(index1, cards1, index2, cards2){
	for(var i = 0; i<cards1.length(); i++){
		var tmp = hands[index1][cards[i]]; //store player 1 card
		hands[index1][cards[i]]=hands[index2][cards[i]]; //make player 1 card = player 2
		hands[index2][cards[i]] = tmp; //make player 2 = stored player 1 original card
	}
	trades[index1] = null;
	trades[index2] = null;
}

function updateGameState(){
	var gameState = {};
	gameState.players = players; //this is the player objects
	gameState.trades = trades; //if there are trades available needs to be shown
	gameState.spectators = spectators;
	gameState.gameMode = gameMode;
	for(var i = 0; i<numberOfPlayers; i++){
		gameState.hand = hands[i];
		io.emit("updateGameState", gameState);
	}
	//ignore spectators for now
}

io.on("connect", function(socket) { //was "connection"
	console.log("Somebody connected to our socket.io server");

	socket.on("disconnect", function() { 
		console.log("Somebody left.");
		var indexOfUser = spectators.map(function(e) { return e.socket; }).indexOf(socket);
		if (indexOfUser!=-1){
			allSockets.splice(indexOfUser, 1); //index to remove at, how many elements to remove.
			allUsernames.splice(indexOfUser, 1); //index to remove at, how many elements to remove.
		}
		else{ 
			indexOfUser = players.map(function(e) { return e.socket; }).indexOf(socket);
			players.splice(indexOfUser, 1);
			sockets.splice(indexOfUser, 1);
			if (gameMode==1) gameMode = 2; //game over if a player leaves during play
		}
		updateGameState();
	});

	socket.on("login", function(obj) { 
		un = obj.username;
		pw = obj.password;
		msg = obj.message;
		console.log("Someone is attempting to " + msg);
		//msg is whether they wanted to login or create a user
		//if the callback didn't work, it's null, so we return false
		//otherwise we emit true after all conditions for creation/login are met
		loginValidation(db, un, pw, msg, socket, function(result){
			if (result != null && msg=="login"){
				//use the db to check password for login
				loginUser(db, un, pw, socket, function(result){
					if(result!=null && result!="error"){
						if (players.length()<=8) players.push({name: un, socket: socket, wins: result[0].wins, losses: result[0].losses, score: 0});
						else spectators.push({name: un, socket: socket}); //don't need wins, losses, or score for spectators
						console.log("Login was successful.");
						io.emit("loginValidation", true);
					} 
					else io.emit("loginValidation, false");
				});
				
			} 
			else if (result == null && msg=="create"){
				//use the db to create a user
				createUser(db, un, pw, socket, function(result){
					if(result!=null && result!="error"){ 
						if (players.length()<=8) players.push({name: un, socket: socket, wins: 0, losses: 0, score: 0});
						else spectators.push({name: un, socket: socket});
						console.log("Create was successful.");
						io.emit("loginValidation", true); 
					} 
					else io.emit("loginValidation", false); //create didn't succeed
				});
			} 
			else{
				io.emit("loginValidation", false); //couldn't login, couldn't create
			} 
		});

		updateGameState();
	});
	socket.on("ready", function(socket){
		ready+=1;
		if(readyToPlay()){
			dealDeck();
			updateGameState();
		}
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
	socket.on("corner", function(corner, player, gameMode){ //what is happening here, we don't get anything from client side on click
		var game = false;
		var round = checkForRoundWin();
		var playerIndex = players.map(function(e) { return e.socket; }).indexOf(socket); 
		if (playerIndex == -1) io.emit("noWin"); //whoever clicked wasn't a player
		else if (round){
			players[playerIndex].score += hands[playerIndex][0].points; //increment their score based on their first card
			game = checkForGameWin(); //check to see if the game is over
			if (game){
				updateScores(db, function(result){
				//not sure if this will work, i have to update ALL the scores but don't have a filter for the db, so using a for loop currently
				if (result=="error") console.log("Error on updating player scores in the database."); 
				});
				gameMode = 0;
				readyToPlay = 0;
				io.emit("gameWin", players[playerIndex].name); //msg is who won
			}
			else if (round){
				dealDeck();
				lastRoundWinner = players[playerIndex].name; //should be a string for player name
				io.emit("roundWin", lastRoundWinner);
			}

		}
		else {
			io.emit("noWin"); //don't need a msg, game play continues
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