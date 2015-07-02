/**
 * A very basic HTML user interface for displaying the units, and capturing 
 * user input via the keyboard.
 */

function UI() {
	this.avatars = {};

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

UI.prototype.createAvatar = function(id, position) {
	// Create a simple div to represent the unit and add to the dom
	var avatar = document.createElement("div");
	avatar.style.width = "10px";
	avatar.style.height = "10px";
	avatar.style.backgroundColor = "red";
	avatar.style.position = "absolute";
	avatar.style.left = position.x + "px";
	avatar.style.top = position.y + "px";
	document.body.appendChild(avatar);
	this.avatars[id] = avatar;
}

UI.prototype.removeAvatar = function(id) {
	// Delete from the DOM
	if (this.avatars[id].parentNode) {
		this.avatars[id].parentNode.removeChild(this.avatars[id]);
	}
	// Delete from the internal list
	delete this.avatars[id];
}

UI.prototype.setPosition = function(id, x, y) {
	if (x === null || y === null) {
		this.avatars[id].style.display = "none";
	} else {
		this.avatars[id].style.left = x + "px";
		this.avatars[id].style.top = y + "px";
		this.avatars[id].style.display = "block";
	}
}

UI.prototype.getInput = function() {
	var input = {
		x: 0,
		y: 0
	};
	if (87 in this.keysDown) { // Up
		input.y -= 1;
	}
	if (83 in this.keysDown) { // Down
		input.y += 1;
	}
	if (68 in this.keysDown) { // Right
		input.x += 1;
	}
	if (65 in this.keysDown) { // Left
		input.x -= 1;
	}
	return input;
}

module.exports = UI;
