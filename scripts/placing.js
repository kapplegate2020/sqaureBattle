function Select(type, buttonElement){
	if(money-pieces[type].placementCost<0){
		window.alert("Sorry, You can't afford that");
	}else{
		if(active.message){
			cancelbutton();
		}
		if(!userNumber){
			for(i=9;i>=5;i--){
				for(j=0;j<=9;j++){
					document.getElementById(j+"x"+i).onmouseover = function(){redhighlight(this.id)};
					document.getElementById(j+"x"+i).onmouseout = function(){dehighlight(this.id)};
				}
			}
			for(i=4;i>=0;i--){
				for(j=0;j<=9;j++){
					document.getElementById(j+"x"+i).onmouseover = function(){highlight(this.id)};
					document.getElementById(j+"x"+i).onmouseout = function(){dehighlight(this.id)};
					document.getElementById(j+"x"+i).onclick = function(){place(this.id, type)};
				}
			}
		}else{
			for(i=4;i>=0;i--){
				for(j=0;j<=9;j++){
					document.getElementById(j+"x"+i).onmouseover = function(){redhighlight(this.id)};
					document.getElementById(j+"x"+i).onmouseout = function(){dehighlight(this.id)};
				}
			}
			for(i=9;i>=5;i--){
				for(j=0;j<=9;j++){
					document.getElementById(j+"x"+i).onmouseover = function(){highlight(this.id)};
					document.getElementById(j+"x"+i).onmouseout = function(){dehighlight(this.id)};
					document.getElementById(j+"x"+i).onclick = function(){place(this.id, type)};
				}
			}
		}
		buttonElement.innerHTML = "Cancel";
		buttonElement.onclick = function(){cancelbutton()};
		active.type = type;
		active.buttonElement = buttonElement;
		active.message = "placing";
	}
}
function cancelbutton(){
	for(i=9;i>=0;i--){
		for(j=0;j<=9;j++){
			document.getElementById(i+"x"+j).onmouseover = "";
			document.getElementById(i+"x"+j).onmouseout = "";
			document.getElementById(i+"x"+j).onclick = "";
		}
	}
	active.buttonElement.innerHTML = "Place";
	active.buttonElement.onclick = function(){Select(active.type, active.buttonElement)};
	active.clear();
}
function redhighlight(elementid){
	var bgcol = document.getElementById(elementid).style.backgroundColor;
	if(bgcol == "rgb(255, 255, 255)"||bgcol == ""){
		document.getElementById(elementid).style.backgroundColor = "#ffbbbb";
	}
}
function highlight(elementid){
	var bgcol = document.getElementById(elementid).style.backgroundColor;
	if(bgcol == "rgb(255, 255, 255)"||bgcol == ""){
		document.getElementById(elementid).style.backgroundColor = "#bbffbb";
	}
}
function dehighlight(elementid){
	var bgcol = document.getElementById(elementid).style.backgroundColor;
	if(bgcol == "rgb(255, 187, 187)"||bgcol == "rgb(187, 255, 187)"){
		document.getElementById(elementid).style.backgroundColor = "#ffffff";
	}
}
function place(loc, type){
	if(money-pieces[type].placementCost<0){
		window.alert("Sorry, You can't afford that");
	}else{
		var someonethere = false;
		for(k=0;k<5;k++){
			for(l=0;l<allies[k].length;l++){
				if(allies[k][l].loc == loc){
					someonethere = true;
				}
			}
		}
		if(!someonethere){
			allies[type].push({loc:loc, hp:pieces[type].startHitpoints});
			money-=pieces[type].placementCost;
			document.getElementById("cash").innerHTML = "You have $"+money;
			makeBox(loc, type, allies[type].length-1, false);
		}
	}
}
function makeBox(loc, type, pieceNumber, isEnemy){
	var health;
	document.getElementById(loc).style.backgroundColor=pieces[type].color;
	if(isEnemy){
		document.getElementById(loc).innerHTML="<img src='E.png' style='width:"+(boxes/2)+";height:"+(boxes/2)+";margin:auto'>";
		health = enemies[type][pieceNumber].hp/pieces[type].startHitpoints*100+"%";
	}else if(!isEnemy&&type!=4){
		document.getElementById(loc).setAttribute("onclick","showStat("+type+","+pieceNumber+")");
		document.getElementById(loc).style.cursor="pointer";
		health = allies[type][pieceNumber].hp/pieces[type].startHitpoints*100+"%";
	}else{
		health = allies[type][pieceNumber].hp/pieces[type].startHitpoints*100+"%";
	}
	document.getElementById(loc).innerHTML += "<div class='healthBar'><div class='healthbarStatus' id='"+loc+"health'></div></div>";
	document.getElementById(loc+"health").style.width = health;
}
function unmakeBox(loc){
	document.getElementById(loc).style.backgroundColor="#ffffff";
	document.getElementById(loc).style.cursor="default";
	document.getElementById(loc).innerHTML="";
	document.getElementById(loc).setAttribute("onclick","");
	document.getElementById(loc).setAttribute("onmouseover","");
	document.getElementById(loc).setAttribute("onmouseout","");
}
function showStat(type, pieceNumber){
	if(active.message=="opponentturn"){
		window.alert("Please wait until your opponent finishes their turn.")
	}else if(active.message=="animating"){
		finishAnimation();
	}else{
		if(active.message){
			cancelMove();
		}
		document.getElementById("statName").innerHTML = pieces[type].capName;
		document.getElementById("statHitpoints").innerHTML = pieces[type].startHitpoints;
		document.getElementById("statMoveCost").innerHTML = pieces[type].moveCost;
		document.getElementById("statMoveButton").setAttribute("onclick", "move("+type+","+pieceNumber+")");
		document.getElementById("statActionName").innerHTML = pieces[type].action;
		document.getElementById("statActionCost").innerHTML = pieces[type].actionCost;
		document.getElementById("statActionButton").setAttribute("onclick", "doAction("+type+","+pieceNumber+")");
		document.getElementById("stat").style.display = "block";
		document.getElementById("stat").style.backgroundColor = pieces[type].shadedColor;
	}
}