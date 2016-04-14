socket = io();
function hideLogin(obj){
	//on a successful login or account creation, hide initial login screen
	socket.emit("login", obj);
	socket.on("loginValidation",function (msg){
		return msg;
	}
}

function login(){
	var obj = {
		obj.username = $("#username").val();
		obj.password = $("#password").val();
		obj.message = $("#username").val();
	}
	$("#loginButton").click(function()
			obj.message = "login";
		if(hideLogin(obj)){
			$("#loginScreen").hide();
		});
	$("#createButton").click(function(){
		obj.message = "create";
		if(hideLogin(obj)){
			$("#loginScreen").hide();
		}
	});
}

function startUp(){

}

$(startUp);
