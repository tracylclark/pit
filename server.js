
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
var hands = [];
var numberOfPlayers;
var gameMode = 0; // gameMode 0 is waiting to start, 1 is in game
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
	elseif(cardName == "sovietBear"){
		return var obj = {
			obj.name = "sovietBear";
			obj.points = 100;
		};
	}
	elseif(cardName == "internetz"){
		return var obj = {
			obj.name = "internetz";
			obj.points = 100;
		};
	}
	elseif(cardName == "rickRoll"){
		return var obj = {
			obj.name = "rickRoll";
			obj.points = 100;
		};

	elseif(cardName == "doge"){
		return var obj = {
			obj.name = "doge";
			obj.points = 100;
		};
	}
	elseif(cardName == "technoViking"){
		return var obj = {
			obj.name = "technoViking";
			obj.points = 100;
		};
	}
	elseif(cardName == "partyVan"){
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
					hands[i].push(deck.splice(1,1));
				}
			}
	}

}

//sit player



// ready game



//check game win



//check round win



//corner
