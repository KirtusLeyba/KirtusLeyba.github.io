//Script to run on homepage canvas
var canvas = document.getElementById("funCanvas");
var ctx = canvas.getContext("2d");

var count = 4;
var speed = 1;
var xPositions = [10, 50, 80, 120];
var yPositions = [10, 50, 80, 120];

init();

function init()
{
	//Fill Background
	ctx.fillStyle = "#2d2e30"
	ctx.fillRect(0,0,canvas.width,canvas.height)
}

function moveToward(indexA, indexB)
{
	if(xPositions[indexA] >= xPositions[indexB])
	{
		xPositions[indexA] = xPositions[indexA] - speed;
	}
	else
	{
		xPositions[indexA] = xPositions[indexA] + speed;
	}
	if(yPositions[indexA] >= yPositions[indexB])
	{
		yPositions[indexA] = yPositions[indexA] - speed;
	}
	else
	{
		yPositions[indexA] = yPositions[indexA] + speed;
	}
}

function update()
{

	//Draw
	for(i = 0; i < count; i++)
	{
		var x = xPositions[i];
		var y = yPositions[i];
		ctx.fillStyle = "#c4daff";
		ctx.fillRect(x,y,5,5);
	}

	//move
	for(i = 0; i < count; i++)
	{
		if(i < count-1)
		{
			moveToward(i, i+1);
		}
		else
		{
			moveToward(i, 0);
		}
	}

	requestAnimationFrame(update)
}

requestAnimationFrame(update)