function cancelMove(){
	updateDisplay();
	if(active.action == "move"){
		document.getElementById("statMoveButton").setAttribute("onclick", "move("+active.type+", "+active.pieceNumber+")");
		document.getElementById("statMoveButton").innerHTML = "Go";
	}else{
		document.getElementById("statActionButton").setAttribute("onclick", "doAction("+active.type+", "+active.pieceNumber+")");
		document.getElementById("statActionButton").innerHTML = "Go";
	}
	active.clear();
}

function move(type, pieceNumber){
	var distance = energy/pieces[type].moveCost;
	if(active.message=="opponentturn"){
		window.alert("Please wait until your opponent finishes their turn.")
	}else if(distance<1){
		window.alert("Sorry, you do not have enough energy for that.");
	}else{
		if(active.message=="animating"){
			finishAnimation();
		}else if(active.message=="acting"){
			cancelMove();
		}
		var x = parseInt(allies[type][pieceNumber].loc.slice(0,1));
		var y = parseInt(allies[type][pieceNumber].loc.slice(2,3));
		for(i=1;i<=distance&&(x+i)<=9;i++){
			var loc = (x+i)+"x"+y;
			var elementcheck = document.getElementById(loc);
			if(elementcheck.style.backgroundColor == "rgb(255, 255, 255)"){
				elementcheck.innerHTML = "<img src='circle.png' style='width:"+(boxes/2)+";height:"+(boxes/2)+";margin:auto'>";
				elementcheck.style.cursor= "pointer";
				elementcheck.setAttribute("onclick", "change('"+loc+"',"+type+","+pieceNumber+")");
			}else{
				i=distance;
			}
		}
		for(i=1;i<=distance&&(y+i)<=9;i++){
			var loc = x+"x"+(y+i);
			var elementcheck = document.getElementById(loc);
			if(elementcheck.style.backgroundColor == "rgb(255, 255, 255)"){
				elementcheck.innerHTML = "<img src='circle.png' style='width:"+(boxes/2)+";height:"+(boxes/2)+";margin:auto'>";
				elementcheck.style.cursor= "pointer";
				elementcheck.setAttribute("onclick", "change('"+loc+"',"+type+","+pieceNumber+")");
			}else{
				i=distance;
			}
		}
		for(i=1;i<=distance&&(x-i)>=0;i++){
			var loc = (x-i)+"x"+y;
			var elementcheck = document.getElementById(loc);
			if(elementcheck.style.backgroundColor == "rgb(255, 255, 255)"){
				elementcheck.innerHTML = "<img src='circle.png' style='width:"+(boxes/2)+";height:"+(boxes/2)+";margin:auto'>";
				elementcheck.style.cursor= "pointer";
				elementcheck.setAttribute("onclick", "change('"+loc+"',"+type+","+pieceNumber+")");
			}else{
				i=distance;
			}
		}
		for(i=1;i<=distance&&(y-i)>=0;i++){
			var loc = x+"x"+(y-i);
			var elementcheck = document.getElementById(loc);
			if(elementcheck.style.backgroundColor == "rgb(255, 255, 255)"){
				elementcheck.innerHTML = "<img src='circle.png' style='width:"+(boxes/2)+";height:"+(boxes/2)+";margin:auto'>";
				elementcheck.style.cursor= "pointer";
				elementcheck.setAttribute("onclick", "change('"+loc+"',"+type+","+pieceNumber+")");
			}else{
				i=distance;
			}
		}
		document.getElementById("statMoveButton").innerHTML = "Cancel";
		document.getElementById("statMoveButton").setAttribute("onclick", "cancelMove("+type+","+pieceNumber+",'move')");
		active.setAction("acting",type,pieceNumber,"move");
	}
}
function change(newLoc, type, pieceNumber){
	allies[type][pieceNumber].newLoc = newLoc;
	updateDisplay();
	var original = allies[type][pieceNumber].loc;
	var deltaX = parseInt(original.slice(0,1))-parseInt(newLoc.slice(0,1));
	var deltaY = parseInt(original.slice(2,3))-parseInt(newLoc.slice(2,3))
	energy-=Math.abs(deltaX+deltaY)*pieces[type].moveCost;
	document.getElementById("statMoveButton").setAttribute("onclick", "move("+type+", "+pieceNumber+")");
	document.getElementById("statMoveButton").innerHTML = "Go";
	animate(newLoc,3-pieces[type].moveCost,null);
}
function finishChange(){
	var original = allies[active.type][active.pieceNumber].loc;
	var newLoc = allies[active.type][active.pieceNumber].newLoc;
	unmakeBox(original);
	makeBox(newLoc,active.type,active.pieceNumber,false);
	allies[active.type][active.pieceNumber].loc = newLoc;
	delete allies[active.type][active.pieceNumber].newLoc;
	
	document.getElementById("energyamt").innerHTML = energy;
	cancelMove();
}


function doAction(type, pieceNumber){
	if(type==2){
		heal(type, pieceNumber);
	}else{
		attack(type, pieceNumber);
	}
}
function attack(type, pieceNumber){
	if(active.message=="opponentturn"){
		window.alert("Please wait until your opponent finishes their turn.")
	}else if (pieces[type].actionCost>energy){
		window.alert("Sorry, you do not have enough energy for that.");
	}else{
		if(active.message=="animating"){
			finishAnimation();
		}else if(active.message=="acting"){
			cancelMove();
		}
		var x = parseInt(allies[type][pieceNumber].loc.slice(0,1));
		var y = parseInt(allies[type][pieceNumber].loc.slice(2,3));
		for(i=9;i>=0;i--){
			for(j=0;j<=9;j++){
				if(Math.abs(i-x)+Math.abs(j-y)<=pieces[type].range){
					var elementcheck = document.getElementById(i+"x"+j);
					if(elementcheck.children[0] != undefined){
						elementcheck.children[0].src = "Eorange.png";
						elementcheck.style.cursor = "pointer";
						elementcheck.onclick = function(){damageEnemy(this.id, type, pieceNumber);};
					}else if(elementcheck.style.backgroundColor == "rgb(255, 255, 255)"){
						elementcheck.innerHTML = "<img src='orange.png' style='width:"+(boxes/2)+";height:"+(boxes/2)+";margin:auto'>";
					}
				}
			}
		}
		document.getElementById("statActionButton").innerHTML = "Cancel";
		document.getElementById("statActionButton").setAttribute("onclick", "cancelMove("+type+", "+pieceNumber+", 'attack')");
		active.setAction("acting",type,pieceNumber,"attack");
	}
}
function damageEnemy(enemyLoc, type, pieceNumber){
	for(k=0;k<5;k++){
		for(l=0;l<enemies[k].length;l++){
			console.log(enemyLoc+" asdf "+enemies[k][l].loc);
			if(enemyLoc==enemies[k][l].loc){
				enemies[k][l].hp-=pieces[type].damage;
				unmakeBox(enemyLoc);
				if(enemies[k][l].hp<=0){
					enemies[k][l].hp=0;
					enemies[k][l].loc = "";
					checkEndGame();
				}else{
					makeBox(enemyLoc,k,l,true);
				}
				energy-=pieces[type].actionCost;
				document.getElementById("energyamt").innerHTML = energy;
				cancelMove(type, pieceNumber, "attack");
			}
		}
	}
}
function checkEndGame(){
	var gameover = true;
	for(i=0;i<4;i++){
		for(j=0;j<enemies[i].length;j++){
			if(enemies[i][j].loc!=""&&i!=2){
				gameover = false;
			}
		}
	}
	if(gameover){
		clearInterval(turn);
		var response = [null,null];
		response[userNumber]=allies;
		response[(userNumber+1)%2]=enemies;
		socket.emit("gameOver", {allies:response, forfeit:false});
		document.getElementById("message").innerHTML = "You Win!";
		document.getElementById("message").style.display = "block";
		active.message = "opponentturn";
	}
}

function heal(type, pieceNumber){
	if(active.message=="opponentturn"){
		window.alert("Please wait until your opponent finishes their turn.")
	}else if (3>energy){
		window.alert("Sorry, you do not have enough energy for that.");
	}else{
		if(active.message=="animating"){
			finishAnimation();
		}else if(active.message=="acting"){
			cancelMove();
		}
		var x = parseInt(allies[type][pieceNumber].loc.slice(0,1));
		var y = parseInt(allies[type][pieceNumber].loc.slice(2,3));
		for(i=9;i>=0;i--){
			for(j=0;j<=9;j++){
				if(Math.abs(i-x)+Math.abs(j-y)<=3){
					var elementcheck = document.getElementById(i+"x"+j);
					if(elementcheck.style.backgroundColor != "rgb(255, 255, 255)"){
						if(elementcheck.children[0] == undefined||elementcheck.children[0].src==undefined){
							elementcheck.innerHTML += "<img src='orange.png' style='width:"+(boxes/2)+";height:"+(boxes/2)+";margin:auto'>";
							elementcheck.style.cursor= "pointer";
							elementcheck.onclick = function(){healAlly(this.id, type, pieceNumber);};
						}
					}
					else if(elementcheck.style.backgroundColor == "rgb(255, 255, 255)"){
						elementcheck.innerHTML = "<img src='orange.png' style='width:"+(boxes/2)+";height:"+(boxes/2)+";margin:auto'>";
					}
				}
			}
		}
		document.getElementById("statActionButton").innerHTML = "Cancel";
		document.getElementById("statActionButton").setAttribute("onclick", "cancelMove("+type+", "+pieceNumber+", 'heal')");
		active.setAction("acting",type,pieceNumber,"heal");
	}
}
function healAlly(allyLoc, type, pieceNumber){
	for(k=0;k<5;k++){
		for(l=0;l<allies[k].length;l++){
			if(allyLoc==allies[k][l].loc){
				allies[k][l].hp+=50;
				if(allies[k][l].hp>pieces[k].startHitpoints){
					allies[k][l].hp=pieces[k].startHitpoints;
				}
				unmakeBox(allyLoc);
				makeBox(allyLoc,k,l,false);
				energy-=3;
				document.getElementById("energyamt").innerHTML = energy;
				cancelMove(type, pieceNumber, "heal");
			}
		}
	}
}


function animate(endPlace, speed, src){
	var startPlace = allies[active.type][active.pieceNumber].loc;
	var animationElement;
	var startX = 0;
	var startY = 0;
	var startPlaceRect = document.getElementById(startPlace).getBoundingClientRect();
	var endPlaceRect = document.getElementById(endPlace).getBoundingClientRect();
	var distanceX = (endPlaceRect.left-parseInt(startPlaceRect.left));
	var distanceY = (endPlaceRect.top-parseInt(startPlaceRect.top));
	var distance = Math.sqrt(distanceX*distanceX+distanceY*distanceY);
	var time = distance/(speed*startPlaceRect.width);
	var deltaX = distanceX/(25*time);
	var deltaY = distanceY/(25*time);
	var directionX = 0;
	if(active.action=="move"){
		animationElement = document.getElementById(startPlace);
	}else{
		animationElement = document.getElementById("animationImage");
		animationElement.src = src;
		startX = startPlaceRect.left;
		startY = startPlaceRect.top;
	}

	animationElement.style.zIndex = 1;
	active.message="animating";

	if(deltaX>0){
		directionX = 1;
	}else if(deltaX<0){
		directionX = -1;
	}
	var directionY = 0;
	if(deltaY>0){
		directionY = 1;
	}else if(deltaY<0){
		directionY = -1;
	}
	console.log(0);
	animationInterval = setInterval(function(){//start moving the image
		console.log("1");
		var leftAligned = (directionX*(distanceX-Number(animationElement.style.left.slice(0,length-2)-startX))<=0);
		var topAligned = (directionY*(distanceY - Number(animationElement.style.top.slice(0,length-2)-startY))<=0);
		if(leftAligned && topAligned){
			finishAnimation();
		}else{
			animationElement.style.left = Number(animationElement.style.left.slice(0,length-2))+deltaX+"px";
			animationElement.style.top = Number(animationElement.style.top.slice(0,length-2))+deltaY+"px";
		}
	}, 40);
}
function finishAnimation(){
	clearInterval(animationInterval);
	if(active.action=="move"){
		var startLoc = allies[active.type][active.pieceNumber].loc;
		var animationDiv = document.getElementById(startLoc);
		animationDiv.style.left = 0;
		animationDiv.style.top = 0;
		animationDiv.style.zIndex = 0;
		finishChange();
	}
}