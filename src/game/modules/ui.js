var Input = require('./input');

function UI() {
	this.avatar = document.createElement("div");
	this.avatar.style.width = "10px";
	this.avatar.style.height = "10px";
	this.avatar.style.backgroundColor = "red";
	this.avatar.style.position = "absolute";
	this.avatar.style.left = "100px";
	this.avatar.style.top = "100px";

	window.avatar = this.avatar;

	document.body.appendChild(this.avatar);

	var self = this;
	this.keysDown = {};
	document.body.addEventListener("keydown", function(e) {
		self.keysDown[e.keyCode] = true;
		//console.log("down", e.keyCode);
	});
	document.body.addEventListener("keyup", function(e) {
		delete self.keysDown[e.keyCode];
	});

}
UI.prototype.setPosition = function(x, y) {
	this.avatar.style.left = x + "px";
	this.avatar.style.top = y + "px";
}
UI.prototype.getInput = function() {
	
	var input = new Input({
		horizontal: 0,
		vertical: 0
	});

	if (87 in this.keysDown) { // Up
		input.vertical -= 1;
	}
	if (83 in this.keysDown) { // Down
		input.vertical += 1;
	}
	if (68 in this.keysDown) { // Right
		input.horizontal += 1;
	}
	if (65 in this.keysDown) { // Left
		input.horizontal -= 1;
	}
	return input;
}

module.exports = UI;