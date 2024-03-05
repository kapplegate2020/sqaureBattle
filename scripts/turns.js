function timer(){//sets timer for when game starts
	document.getElementById("message").innerHTML = "";
	document.getElementById("message").style.display = "none";
	document.getElementById("place").style.display="block";
	timerchange = setInterval(starttimer, 1000);
}
function starttimer(){//continues timer
	if(secondsleft>=10){
		document.getElementById("timer").innerHTML = "0:"+secondsleft;
		secondsleft--;
	}else if(secondsleft>=0){
		document.getElementById("timer").innerHTML = "0:0"+secondsleft;
		secondsleft--;
	}else{
		clearInterval(timerchange);
		if(active.message){
			cancelbutton();
		}
		active.message = "opponentturn";
		getReadyForTurns();
	}
}
function getReadyForTurns(){//after timer, submits info, and recieves info from other user
	socket.emit("startGameLocations", {allies:allies});
	socket.on("startGameLocationsResponse", function(data){
		console.log("hello wolrd");
		enemies = data[(userNumber+1)%2];
		time +=65000;
		updateDisplay();
		document.getElementById("place").style.display = "none";
		document.getElementById("use").style.display = "block";
		document.getElementById("message").innerHTML = "Opponent's turn";
		document.getElementById("message").style.display = "block";
		if(!userNumber){
			startTurn();
		}
	});
}


socket.on("yourTurn", function(data){
	console.log(data);
	allies = data[userNumber];
	enemies = data[(userNumber+1)%2];
	startTurn();
});

function startTurn(){
	updateDisplay();
	energy+=10;
	document.getElementById("energyamt").innerHTML = energy;
	document.getElementById("message").style.display = "none";
	active.clear();
	document.getElementById("timer").innerHTML = "1:00";
	secondsleft=59;
	turn = setInterval(turntimer, 1000);
}
function turntimer(){
	if(secondsleft>=10){
		document.getElementById("timer").innerHTML = "0:"+secondsleft;
		secondsleft--;
	}else if(secondsleft>=0){
		document.getElementById("timer").innerHTML = "0:0"+secondsleft;
		secondsleft--;
	}else{
		endturn();
	}
}
function endturn(){
	clearInterval(turn);
	if(active.message=="animating"){
		finishAnimation();
	}else if(active.message=="acting"){
		cancelMove();
	}
	document.getElementById("timer").innerHTML = "0:00";
	document.getElementById("message").style.display = "block";
	active.message = "opponentturn";
	var response = [null,null];
	response[userNumber] = allies;
	response[(userNumber+1)%2] = enemies;
	socket.emit("turnSwitch", response);
}

function updateDisplay(){//updates the display
	for(i=9;i>=0;i--){//reset
		for(j=0;j<=9;j++){
			unmakeBox(i+"x"+j);
		}
	}
	for(i=0;i<5;i++){
		for(j=0;j<allies[i].length;j++){//put back good guys
			if(allies[i][j].hp!=0){
				makeBox(allies[i][j].loc,i,j,false);
			}
		}
		for(j=0;j<enemies[i].length;j++){//put in bad guys
			if(enemies[i][j].hp!=0){
				makeBox(enemies[i][j].loc,i,j,true);
			}
		}
	}
}

socket.on("loserhaha", function(data){
	allies = data[userNumber];
	enemies = data[(userNumber+1)%2];
	updateDisplay();
	document.getElementById("message").innerHTML = "You lose :(";
	active.message = "opponentturn";
});