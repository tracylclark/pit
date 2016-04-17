socket = io();
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
	$("#trade").click(function()){
		socket.emit("trade", trades);
	}
	$("#corner".click(function())){
		socket.emit("corner");
	}

}

$(startUp());
