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
	socket.emit("login", obj);
	socket.on("loginValidation",function (msg){
		return msg;
	});
	socket.on("gameWin", function(msg){
		//update the GUI, display a msg with who won, etc
		updateGUI();

	});
	socket.on("roundWin", function(msg){
		//increment game scores, create a round won by message, etc
		updateGUI();
	});
	
	$("#loginButton").click(function(){
			obj.message = "login";
		if(hideLogin(obj)){ //this should only happen on a valid login
			$("#loginScreen").hide();
		}});
	$("#createButton").click(function(){
		obj.message = "create";
		if(hideLogin(obj)){
			$("#loginScreen").hide();
		}
	});
	var obj = {
		username: $("#username").val(),
		password: $("#password").val()
	};
	obj.username = escapeHTML(obj.username); //sanitize the input username before sending it to the server
	obj. password = escapeHTML(obj.password); //sanitize the input password before sending it to the server
	// login();
}

$(startUp());
