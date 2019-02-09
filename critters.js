//default grid values
var gridDrawWidth = 600; //in pixels
var gridDrawHeight = 600;
var gridWidth = 50; //in num cells
var gridHeight = 50;
var cellWidth = gridDrawWidth/gridWidth; //in pixels
var cellHeight = gridDrawHeight/gridHeight;


//some utility functions
//returns integer between top and bottom
//both included
function randInt(bottom, top)
{
	return Math.floor(Math.random()*(top-bottom+1)) + bottom;
}

//returns float between top and bottom
function randFloat(bottom, top)
{
	return Math.random()*(top-bottom) + bottom;
}

//generates color array for visualization
function genColorArray(numColors)
{
	colors = []
	for(var i=0; i < numColors; i++)
	{
		colors.push('#'+ ('000000' + Math.floor(Math.random()*16777215).toString(16)).slice(-6));
	}
	return colors
}

//returns the max index in an array of nums
function maxi(a)
{
	var max = a[0];
	var i = 0;
	for(var j = 1; j < a.length; j++)
	{
		if(a[j] > max)
		{
			max = a[j];
			i = j;
		}
	}
	return i;
}

function getByPos(x,y)
{
	for(var i = 0; i < population.length; i++)
	{
		if(population[i].x == x && population[i].y == y)
		{
			return population[i];
		}
	}
	return -1;
}



//Draws the grid with the selected parameters
//returns the d3 rects of the grid in an array.
function drawGrid(drawWidth, drawHeight, gw, gh, cwidth, cheight)
{
	var grid = d3.select("#gridRegion")
    .append("svg")
    .attr("width",drawWidth)
    .attr("height",drawHeight);

	var d3cells = {};

	for(var i = 0; i < gw; i++)
	{
		for(var j = 0; j < gh; j++)
		{
			var rect = grid.append("rect")
							.attr("x", i*cwidth)
							.attr("y", j*cheight)
							.attr("width", cwidth)
							.attr("height", cheight)
							.style("fill", "black")
							.style("stroke", "white");
			d3cells[i.toString() + "," + j.toString()] = rect;
		}
	}

	return d3cells;
}

function buildSpeciedGrid(gw, gh)
{
	var sgrid = [];
	for(var i=0; i < gw; i++)
	{
		sgrid.push([]);
		for(var j=0; j<gh; j++)
		{
			sgrid[i].push(-1);
		}
	}
	return sgrid;
}

//updates the grid with new proportions
function updateGrid()
{
	var gwidth = document.getElementById('gwidth').value;
	var gheight = document.getElementById('gheight').value;
	
	gridWidth = parseInt(gwidth);
	gridHeight = parseInt(gheight);

	cellWidth = gridDrawWidth/gridWidth;
	cellHeight = gridDrawHeight/gridHeight;

	d3.select("svg").remove();
	d3gridCells = drawGrid(gridDrawWidth, gridDrawHeight, gwidth, gheight, cellWidth, cellHeight);

	//clear pop and sgrid
	sgrid = buildSpeciedGrid(gridWidth, gridHeight);
	population = [];

	iteration = 0;
	pauseSim();
}

//generates a new random individual
function generateIndividual(gwidth, gheight, species)
{
	var indiv = new Object();
	indiv.x = randInt(0, gwidth-1);
	indiv.y = randInt(0, gheight-1);
	indiv.v = new Array();
	indiv.I = new Array();
	indiv.m = new Array();
	indiv.hp = 100;
	for(var i = 0; i < 8; i++)
	{
		indiv.v.push(0.0);
	}
	for(var i = 0; i < 9; i++)
	{
		indiv.m.push(0.0);
		indiv.I.push(new Array()); //i,j -> row column oriented
		for(var j = 0; j < 8; j++)
		{
			indiv.I[i].push(randFloat(-1,1));
		}
	}
	indiv.species = species;

	//sets the individuals vision vector
	indiv.calculateV = function(){
		var k = 0;
		for(var i = -1; i <= 1; i++)
		{
			for(var j = -1; j <= 1; j++)
			{
				if(!(i == 0 && j == 0))
				{
					var x = this.x + i;
					var y = this.y + j;
					if(x >= 0 && x < gwidth && y >= 0 && y < gheight)
					{
						if(sgrid[x][y] == -1)
						{
							this.v[k] = 0;
						}
						else if(sgrid[x][y] == this.species)
						{
							this.v[k] = 1;
						}
						else
						{
							this.v[k] = -1;
						}
					}
					else
					{
						this.v[k] = 0;
					}
					k++;
				}
			}
		}
	};

	//calculate move vector
	indiv.calculateM = function(){


		for(var ii = 0; ii < 9; ii++)
		{
			var prod = 0.0
			for(var jj = 0; jj < 8; jj++)
			{
				prod += this.I[ii][jj]*this.v[jj]
			}
			this.m[ii] = prod;
		}
	}

	//mate with another individual
	indiv.mate = function(other)
	{
		var totalMutation = 1;
		child = generateIndividual(gwidth, gheight, this.species);
		for(var i = 0; i < 9; i++)
		{
			for(var j = 0; j < 8; j++)
			{
				if(Math.random() < 0.5)
				{
					child.I[i][j] = this.I[i][j];
				}
				else
				{
					child.I[i][j] = other.I[i][j];
				}
				var mute = Math.random()
				if(mute < mutationRate)
				{
					totalMutation += 1;
					child.I[i][j] = randFloat(-1,1);
					if(totalMutation > mutationsPerSpecies)
					{
						child.species = this.species+1;
					}
				}
			}
		}

		return child;
	}

	//update the individual
	indiv.tryMove = function(gwidth, gheight){
		this.calculateV();
		this.calculateM();
		var maxIndex = maxi(this.m);
		var mx = this.x;
		var my = this.y;
		var k = 0;
		for(var i = -1; i <= 1; i++)
		{
			for(var j = -1; j <= 1; j++)
			{
				mx = this.x + i;
				my = this.y + j;
				if(k == maxIndex)
				{
					break;
				}
				k++;
			}
			if(k == maxIndex)
			{
				break;
			}
		}


		if(mx >= 0 && mx < gwidth && my >= 0 && my < gheight)
		{
			//simply move if empty
			if(sgrid[mx][my] == -1)
			{
				sgrid[this.x][this.y]  = -1;
				sgrid[mx][my] = this.species;
				this.x = mx;
				this.y = my;
			}
			//try to reproduce if friend
			else if(!(mx == this.x && my == this.y) && sgrid[mx][my] == this.species && Math.random() < mateChance)
			{
				//for now every individual is born to the left of its parent
				ox = mx-1;
				oy = my;
				if(ox >= 0 && ox < gwidth && oy >= 0 && oy < gheight)
				{
					if(sgrid[ox][oy] == -1)
					{
						other = getByPos(mx,my);
						child = this.mate(other);
						child.x = ox;
						child.y = oy;
						sgrid[ox][oy] = child.species;
						population.push(child);
					}
				}
			}
			else if(sgrid[mx][my] != this.species)
			{
				other = getByPos(mx,my);
				other.hp -= attackDamage;
				this.hp += attackHealth;
				console.log("I attacked and my health is now " + this.hp);
			}

		}

	}

	return indiv;
}

//generates a random population and places them into random grid locations
function generatePopulation(popSize, gwidth, gheight)
{
	population = [];
	popsAdded = 0;
	while(popsAdded < popSize)
	{
		var indiv = generateIndividual(gwidth, gheight, 0);
		if(sgrid[indiv.x][indiv.y] == -1)
		{
			sgrid[indiv.x][indiv.y] = indiv.species;
			popsAdded++;
			population.push(indiv);
		}
	}

	return population;
}

//updates the colors on the grid
function redrawGrid(gwidth, gheight)
{
	for(var i = 0; i < gwidth; i++)
	{
		for(var j = 0; j < gheight; j++)
		{
			if(sgrid[i][j] == -1)
			{
				d3gridCells[i.toString() + "," + j.toString()].style("fill","black");
			}
			else
			{
				d3gridCells[i.toString() + "," + j.toString()].style("fill",colors[sgrid[i][j]%numColors]);
			}
		}
	}
}

function startSim()
{
	var popSize = parseInt(document.getElementById('initPop').value);
	//reset sgrid
	sgrid = buildSpeciedGrid(gridWidth, gridHeight);
	population = generatePopulation(popSize, gridWidth, gridHeight);
	redrawGrid(gridWidth, gridHeight);
	running = true;
	iteration = 0;
}

function pauseSim()
{
	running = false;
}

function continueSim()
{
	running = true;
}

function setParams()
{
	mutationRate = parseFloat(document.getElementById('muteRate').value);
	mutationsPerSpecies = parseFloat(document.getElementById('perSpecies').value);
	mateChance = parseFloat(document.getElementById('mateChance').value);
	aging = parseFloat(document.getElementById('aging').value);
	attackDamage = parseFloat(document.getElementById('attackDamage').value);
	attackHealth = parseFloat(document.getElementById('attackHealth').value);
}


function setDelay()
{
	delay = parseInt(document.getElementById('delay').value);
}



//running the sim
///setting some global variables
/// draw the initial grid
var d3gridCells = drawGrid(gridDrawWidth, gridDrawHeight, gridWidth, gridHeight, cellWidth, cellHeight);
var sgrid = buildSpeciedGrid(gridWidth, gridHeight);
var numColors = 100;
var colors = genColorArray(numColors);
var population = []


var iteration = 0
var running = false;
var delay = 0;

//population variables
var mutationRate = 0.1
var mutationsPerSpecies = 5;
var mateChance = 0.1;
var aging = 1;
var attackDamage = 10;
var attackHealth = 10;


// the main update loop
function update()
{

	if(running)
	{
		//udpate everyone
		var indivsToKill = [];
		for(var i = 0; i < population.length; i++)
		{
			population[i].tryMove(gridWidth, gridHeight);
			population[i].hp -= aging;
		}

		newpopulation = []
		for(var i = 0; i < population.length; i++)
		{
			if(population[i].hp >= 0)
			{
				newpopulation.push(population[i]);
			}
			else
			{
				sgrid[population[i].x][population[i].y] = -1;
			}
		}
		population = newpopulation;

		iteration++;
		document.getElementById("iterationcount").innerHTML = "Iteration = " + iteration.toString(); 

		redrawGrid(gridWidth, gridHeight);
	}

	document.getElementById("currentDelay").innerHTML = "delay = " + delay.toString(); 
	document.getElementById("currentPop").innerHTML = "Current Population = " + population.length.toString();
	document.getElementById("currentMuteRate").innerHTML = "Mutation Rate = " + mutationRate; 

	//next update
	setTimeout(update,delay);

}

setTimeout(update, delay);