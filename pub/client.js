/*
Tracy Clark
Ben Slater
CS 365 
Group Project: Pit
*/
socket = io();
var user;
var hand = [];
var trades = [];
var playerNames = [];
trades.cards = [];
var selectedCards = [];

function escapeHTML(theString) {
	return theString
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\//g, "&#47;")  
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function highlightCard(cell){
	$(cell).css("border", "3px solid #ff66ff"); 
}

function unhighlightCard(cell){
	$(cell).css("border", "1px solid black");
}

function find(array, val){
	for(var i = 0; i < array.length(); i++){
		if(i == val){
			return true;
		}
	}
	return false;
}


function startUp(){

	socket.on("gameWin", function(msg){ //server sends string: name of winner
		alert(msg +" has won the game."); //display who won
	});

	socket.on("roundWin", function(msg){ //server sends string: name of round winner
		alert(msg + " has won the round.");
	});

	socket.on("updateGameState", function(gameState){ //server send gamestate object
		updateGameState(gameState);
	});

	socket.on("loginValidation", function(msg){  //server returns boolean - success
		if(msg){ //this should only happen on a valid login
			$("#loginScreen").hide(); 
			$("#rules").hide();
			$(".userTable").show();
			$("#ready").show();
		}
		else{
			alert("Username may be taken or password may be incorrect, try again.");
		}
	});
	socket.on("gameOver", function(){
		alert("Someone left the game during play. Click ready to restart the game.")
	});

	function login(message){
		user = $("#username").val();
		var userCredentials = {
			username: user,
			password: $("#password").val()
		};
		userCredentials.username = escapeHTML(userCredentials.username); //sanitize the input username before sending it to the server
		userCredentials.password = escapeHTML(userCredentials.password); //sanitize the input password before sending it to the server
		userCredentials.message = message;
		socket.emit("login", userCredentials);
	}
	$("#loginButton").click(function(){login("login");}); 
	$("#createButton").click(function(){login("create");});

	[0,1,2,3,4,5,6,7,8].forEach(function(i){
		$("#cell"+i).click(function(){
			if(selectedCards.indexOf(i) == -1){ 
				highlightCard("#cell"+i); 
				selectedCards.push(i);
			}
			else{
				unhighlightCard("#cell"+i);
				selectedCards.splice(selectedCards.indexOf(i), 1);
			}
		});
	});

	$("#trade").click(function(){
		socket.emit("trade", selectedCards);
		selectedCards = [];
		unhighlightCard(".card");
	});

	$("#corner").click(function(){
		socket.emit("corner"); 
	});

	$("#ready").click(function(){
		socket.emit("ready");
	});

	function acceptTrade(index){
		socket.emit("acceptTrade", {offeredPlayerIndex:index, cards:selectedCards} );
		selectedCards = [];
		unhighlightCard(".card");
	}

[0,1,2,3,4,5,6,7].forEach(function(i){
$("#trade"+i).click(function(){acceptTrade(i);}); //when the click happens the anonymous function runs and calls acceptTrade
});
}

function updateGameState(gameState){
	console.log(gameState);
	if (gameState.gameMode==1){
		$("#trade").show();
		$("#playerHand").show();
		$("#ready").hide();
		$("#corner").show(); 
		gameState.hand.forEach(function(card, i){
			$("#cell"+i).css("background-image", 'url("'+card.name+'.png")');
		});
	}
	if (gameState.gameMode==2){ 
		$("#corner").hide();
		$("#ready").show();
		$("#trade").hide();
		$("#playerHand").hide();
	}
	[0,1,2,3,4,5,6,7].forEach(function(i){
		$("#row"+i).hide();
	});
	gameState.players.forEach(function(player, i){
		$("#player"+i).html(player.name);
		$("#score"+i).html(player.score);
		$("#win"+i).html(player.wins);
		$("#loss"+i).html(player.losses);
		if(gameState.trades[i].length > 0){
			$("#trade"+i).show();
			$("#numberOfCards"+i).html(gameState.trades[i].length);
		}
		else{
			$("#acceptTrade"+i).hide();
			$("#trade"+i).hide()
			$("#numberOfCards"+i).html("");
		}
		$("#row"+i).show();
	});
}

$(startUp);
