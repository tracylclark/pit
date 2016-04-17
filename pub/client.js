socket = io();
var user;
var hand = [];
var trades;
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

function hideLogin(obj){
	//on a successful login or account creation, hide initial login screen

}

function login(){

}


function startUp(){
	socket.on("gameWin", function(msg){
		//update the GUI, display a msg with who won, etc
		updateGUI();

	});
	socket.on("roundWin", function(msg){
		//increment game scores, create a round won by message, etc
		updateGUI();
	});

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
			$("#loginScreen").style.visibility = "hidden";
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
		trades.user = user;
		socket.emit("trade", trades);
		trades.cards = [];
		$(".card").forEach(function(){
			unhighlightCard(".card");
		});
	}
	$("#corner".click(function())){
		socket.emit("corner");
	}
	socket.on("tradeValid", function(msg)){
		if(msg.valid){ //if it was a valid trade offer
			numberOfCards = msg.numberOfCards;
			//update GUI with trade objects
		}
	}
	//when we build the scoreboard then we just id each row appended by the users name
}

function highlightCard(cell){
	$(cell).css("background-color", "rgba(255,180,0,.5)");
}
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
