socket = io();
var user;
var hand = [];
var trades;
var numOfPlayers;
var playerNames = [];
trades.cards = [];
function escapeHTML(theString) {
	return theString
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\//g, "&#47;")  // \/  represents the / here.
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function startUp(){
	socket.on("gameWin", function(msg){
		//update the GUI, display a msg with who won, etc
		windows.allert(msg +" has won the game");
		//updateGUI();

	});
	socket.on("roundWin", function(msg){
		//increment game scores, create a round won by message, etc
		windows.allert(msg " has won the round");
		//updateGUI();
	});
	socket.on("updateGameState", function(obj){
		numOfPlayers = obj.players.length();
		updateGameState(obj);
	})

	$("#loginButton").click(function(){
		user = $("#username").val();
		var obj = {
			username: $("#username").val(),
			password: $("#password").val()
		};
		obj.username = escapeHTML(obj.username); //sanitize the input username before sending it to the server
		obj.password = escapeHTML(obj.password); //sanitize the input password before sending it to the server
		obj.message = "login";
		socket.emit("login", obj);
		}});
	$("#createButton").click(function(){
		user = $("#username").val();
		var obj = {
			username: $("#username").val(),
			password: $("#password").val()
		};
		obj.username = escapeHTML(obj.username); //sanitize the input username before sending it to the server
		obj.password = escapeHTML(obj.password); //sanitize the input password before sending it to the server
		obj.message = "create";
		socket.emit("login", obj);
	});
	socket.on("loginValidation", function(msg){
		if(msg){ //this should only happen on a valid login
			$("#loginScreen").style.visibility = "hidden"; //may need to hide individual elements if this doesn't work
			$("#trade").style.visibility = "visible";
			$("#corner").style.visibility = "visible";
		}
	});
	//need to create an array of card objects that they want to trade as a global, then the click button will
	//send that to the server
	//clickHandlier on cards, will put selected cards objects onto trades.cards []
	$("#cell0").click(function{
		if(find(trades.cards, 0)){
			highlightCard("#cell0");
			trades.cards.push(0);
		}
		else{
			unhighlightCard("#cell0");
			trades.cards.splice(0,1);
		}
	});
	$("#cell1").click(function{
		if(find(trades.cards, 1)){
			highlightCard("#cell1");
			trades.cards.push(1);
		}
		else{
			unhighlightCard("#cell1");
			trades.cards.splice(1,1);
		}
	});
	$("#cell2").click(function{
		if(find(trades.cards, 2)){
			highlightCard("#cell2");
			trades.cards.push(2);
		}
		else{
			unhighlightCard("#cell2");
			trades.cards.splice(2,1);
		}
	});
	$("#cell3").click(function{
		if(find(trades.cards, 3)){
			highlightCard("#cell3");
			trades.cards.push(3);
		}
		else{
			unhighlightCard("#cell3");
			trades.cards.splice(3,1);
		}
	});
	$("#cell4").click(function{
		if(find(trades.cards, 4)){
			highlightCard("#cell4");
			trades.cards.push(4);
		}
		else{
			unhighlightCard("#cell4");
			trades.cards.splice(4,1);
		}
	});
	$("#cell5").click(function{
		if(find(trades.cards, 5)){
			highlightCard("#cell5");
			trades.cards.push(5);
		}
		else{
			unhighlightCard("#cell5");
			trades.cards.splice(5,1);
		}
	});
	$("#cell6").click(function{
		if(find(trades.cards, 6)){
			highlightCard("#cell6");
			trades.cards.push(6);
		}
		else{
			unhighlightCard("#cell6");
			trades.cards.splice(6,1);
		}
	});
	$("#cell7").click(function{
		if(find(trades.cards, 7)){
			highlightCard("#cell7");
			trades.cards.push(7);
		}
		else{
			unhighlightCard("#cell7");
			trades.cards.splice(7,1);
		}
	});
	$("#cell7").click(function{
		if(find(trades.cards, 7)){
			highlightCard("#cell7");
			trades.cards.push(7);
		}
		else{
			unhighlightCard("#cell7");
			trades.cards.splice(7,1);
		}
	});
	$("#cell8").click(function{
		if(find(trades.cards, 8)){
			highlightCard("#cell8");
			trades.cards.push(8);
		}
		else{
			unhighlightCard("#cell8");
			trades.cards.splice(8,1);
		}
	});
	$("#trade").click(function()){
		trades.player1 = user;
		socket.emit("trade", trades);
		trades.cards = [];
		$(".card").forEach(function(){
			unhighlightCard(".card");
		});
	}
	$("#corner".click(function())){
		socket.emit("corner");
	}

	for(var k = 0; k < numOfPlayers; k++){
		$(".acceptTrade "+ k ).click(function(){
			$(button).appendTo($('acceptButton') + k);
			$('<input></input>').attr({'type': 'button'}).val("button").click(function(){
					trades.player2 = playerNames[k];
					socket.emit("acceptTrade", trades)
			}).appendTo($('acceptButton' + k));
		});
	}
	//when we build the scoreboard then we just id each row appended by the users name
}

function updateGUI(obj){
	$("#userTable").children.remove();
	var row = document.createElement("div");
	row.className = "row headerRow";
	for(var i = 0; i < 6; i++){
		var cell = document.createElement("div");
		cell.className = "cell";
		if(i == 0){
			cell.innerHTML = "user";
		}
		else if(i == 1){
			cell.innerHTML = "score";
		}
		else if(i == 2){
			cell.innerHTML = "wins";
		}
		else if(i == 3){
			cell.innerHTML = "losses";
		}
		else if(i == 4){
			cell.innerHTML = "acceptTrade";
		}
		else if(i == 5){
			cell.innerHTML = "numCardsTrade";
		}
	}
	$("#userTable").appendChild(row);
	for(i = 0; i < obj.players.length(); i++){
		row.className = obj.players[i].user;
		for(var j =0; j < 6; j++){
			if(j == 0){
				cell.innerHTML = obj.players[i].user;
				playerNames[i] = obj.players[i].user;
			}
			else if(j == 1){
				cell.innerHTML = obj.players[i].score;
			}
			else if(j == 2){
				cell.innerHTML = obj.players[i].wins;
			}
			else if(j == 3){
				cell.innerHTML = obj.players[i].losses;
			}
			else if(j == 4){
				cell.innerHTML = "tradeButton";
				cell.className = "acceptButton" + i;
			}
			else if(j == 5){
				cell.innerHTML = obj.trades[i].length();
			}
		}
		$("#userTable").appendChild(row);
		$(".acceptButton" + i).visibliity = "hidden";
		if(obj.trades[i] != null){
			$(".acceptButton" + i).visibliity = "visible";
		}
	}
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

$(startUp());
