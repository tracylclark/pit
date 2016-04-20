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
	$(cell).css("background-color", "rgba(255,180,0,.5)");
}

function unhighlightCard(cell){
	$(cell).css("background-color", "");
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
		windows.alert(msg +" has won the game."); //display who won
	});
  
	socket.on("roundWin", function(msg){ //server sends string: name of round winner
		windows.alert(msg + " has won the round.");
	});
  
	socket.on("updateGameState", function(gameState){ //server send gamestate object
		updateGameState(gameState);
	})
  
	socket.on("loginValidation", function(msg){  //server returns boolean - success
		if(msg){ //this should only happen on a valid login
			$("#loginScreen").hide(); //may need to hide individual elements if this doesn't work
			$("#trade").show();
			$("#corner").show();
		}
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
  
	//need to create an array of card indexes that they want to trade as a global, clicking trade will send it to the server
  [0,1,2,3,4,5,6,7].forEach(function(i){
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

	function acceptTrade(index){
    var selecteduserName = $("player"+index).innerhtml();
    socket.emit("acceptTrade", {player1:selectedUserName, cards:selectedCards} );
  }
  
  [0,1,2,3,4,5,6,7].forEach(function(i){
    $("#trade"+i).click(function(){acceptTrade(i);}); //when the click happens the anonymous function runs and calls acceptTrade
  });
}

function updateGUI(gameState){
  if (gameState.gameMode==1){
   $("ready").hide(); 
  }
  if (gameState.gameMode==2){
   $("ready").show(); 
  }
  gameState.players.forEach(function(player, i){
    $("#player"+i).innerhtml(player.name);
    $("#score"+i).innerhtml(player.score);
    $("#win"+i).innerhtml(player.wins);
    $("#loss"+i).innerhtml(player.losses);
    if(gameState.trades[i].length > 0){
      $("#trade"+i).show();
      $("#numberOfCards"+i).innerhtml(gameState.trades[i].length);
    }
    else{
      $("#trade"+i).hide();
      $("#numberOfCards"+i).innerhtml("");
    }
  });
}

$(startUp());
