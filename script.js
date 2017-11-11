//Script to run on homepage canvas
var canvas = document.getElementById("funCanvas");
var ctx = canvas.getContext("2d");
init();

function init()
{
	//Fill Background
	ctx.fillStyle = "#2d2e30"
	ctx.fillRect(0,0,canvas.width,canvas.height)
}

function update()
{
	var x = Math.floor(Math.random()*canvas.width);
	var y = Math.floor(Math.random()*canvas.height);
	ctx.fillStyle = "#c4daff";
	ctx.fillRect(x,y,5,5);
	requestAnimationFrame(update)
}

requestAnimationFrame(update)