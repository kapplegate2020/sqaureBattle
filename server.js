var http = require('http');
var url = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var passwordHash = require('password-hash');
var mongourl = "mongodb://localhost:27017/";

//clears game data and makes all users inactive on startup
var gameNum = 1;
MongoClient.connect(mongourl, function(err, db) {
	if (err) throw err;
	var dbo = db.db("squarebattle");
	dbo.collection("profile").updateMany({},{$set:{active:false,gameNum:null}}, function(err, res){
		if (err) throw err;
	});
	dbo.collection("games").deleteMany({}, function(err, res){
		if (err) throw err;
	});
});

//sets up server and redirects user
var server = http.createServer(function (req, res) {
	var pathname = url.parse(req.url).pathname;
	var fileType = pathname.split(".")[1];
	if(pathname === "/"){
		fs.readFile('home.html', function(err, data) {
			if (err) {
				throw err;
			}
			res.write(data);
			res.end();
		});
	}else if(pathname === "/signin"){
		fs.readFile('signin.html', function(err, data) {
			if (err) throw err;
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(data);
			res.end();
		});
	}else if(pathname === "/signup"){
		fs.readFile('signup.html', function(err, data) {
			if (err) throw err;
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(data);
			res.end();
		});
	}else if(pathname === "/game"){
		fs.readFile('game.html', function(err, data) {
			if (err) throw err;
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(data);
			res.end();
		});
	}else if(pathname === "/lobby"){
		fs.readFile('lobby.html', function(err, data) {
			if (err) throw err;
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(data);
			res.end();
		});
	}else if(fileType=="png"){
		fs.readFile("images/"+pathname, function(err, data) {
			if (err){
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write("Er 404 Not Found");
				res.end();
			}else{
				res.writeHead(200, {'Content-Type': 'image/png'});
				res.write(data);
				res.end();
			}
		});
	}else if(fileType=="js"){
		fs.readFile("scripts/"+pathname, function(err, data) {
			if (err){
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write("Er 404 Not Found");
				res.end();
			}else{
				res.writeHead(200, {'Content-Type': 'application/javascript'});
				res.write(data);
				res.end();
			}
		});
	}else if(fileType=="css"){
		fs.readFile("styles/"+pathname, function(err, data) {
			if (err){
				res.writeHead(404, {'Content-Type': 'text/html'});
				res.write("Er 404 Not Found");
				res.end();
			}else{
				res.writeHead(200, {'Content-Type': 'text/css'});
				res.write(data);
				res.end();
			}
		});
	}else{
		res.writeHead(404, {'Content-Type': 'text/html'});
		res.write("Er 404 Not Found");
		res.end();
	}
}).listen(80);


//sets up socket.io
var io = require('socket.io')(server);
io.of("/signin").on("connection", function(socket){
	console.log("connected /signin");
	socket.on("signIn", function(data){
		if(data.username.length>15){
			socket.emit("signInResponse", {authorized:false,errorCode:0});
			console.log("failed signin");
		}else{
			MongoClient.connect(mongourl, function(err, db) {
				if (err) throw err;
				var dbo = db.db("squarebattle");
				dbo.collection("profile").findOne({username:data.username}, function(err, res) {
					if (err) throw err;
					if(!res){//username does not exist
						socket.emit("signInResponse", {authorized:false,errorCode:0});
						console.log("failed signin");
					}else if(!passwordHash.verify(data.password, res.password)){//incorrect password
						socket.emit("signInResponse", {authorized:false,errorCode:0});
						console.log("failed signin");
					}else if(!passwordHash.verify(data.password, res.password)){//incorrect password
						socket.emit("signInResponse", {authorized:false,errorCode:0});
						console.log("failed signin");
					}else if(res.active){//already signed in on other page
						socket.emit("signInResponse", {authorized:false,errorCode:1});
						console.log("failed signin");
					}else{//successful login
						var sessionCode = Math.floor(Math.random() * 9000000000 ) + 1000000000;
						dbo.collection("profile").updateOne({username:data.username},{$set:{sessionCode:sessionCode,sessionCodeTime:Date.now()}}, function(err, res){
							if (err) throw err;//submits data
								console.log("successful login");
								socket.emit("signInResponse", {authorized:true,sessionCode:sessionCode});//returns success
						});
					}
				});
			});
		}
	});
})

io.of("/signup").on("connection", function(socket){
	console.log("connected /signup");
	socket.on("signUp", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("profile").findOne({username:data.username}, function(err, res) {
				if (err) throw err;
				if(res){//username was taken
					socket.emit("signUpResponse", {authorized:false,errorCode:0});
					console.log("signup failed");
				}else if(data.username.length<1||data.username.length>15){//username is correct length
					socket.emit("signUpResponse", {authorized:false,errorCode:1});
					console.log("signup failed");
				}else if(data.password.length<8||data.password.length>20){//password is correct length
					socket.emit("signUpResponse", {authorized:false,errorCode:2});
					console.log("signup failed");
				}else{//successful signup
					var userdata = {};
					userdata.username = data.username;
					userdata.password = passwordHash.generate(data.password);
					userdata.sessionCode = Math.floor(Math.random() * 9000000000 ) + 1000000000;
					userdata.sessionCodeTime = Date.now();
					dbo.collection("profile").insertOne(userdata, function(err, res) {
						if (err) throw err;
						console.log("user added");
						socket.emit("signUpResponse", {authorized:true,sessionCode:userdata.sessionCode});
					});
				}
			});
		});
	});
});

io.of("/lobby").on("connection", function(socket){
	console.log("connected /lobby");
	var username;
	var confirmUsername = setTimeout(function(){
		socket.emit("slowconnection");
		socket.disconnect(true);
		console.log("disconnected");
	}, 1000);
	socket.on("authorizeUser", function(data){
		clearTimeout(confirmUsername); 
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("profile").findOne({username:data.username}, function(err, res) {
				if (err) throw err;
				if(!res){//username doesn't exist
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
					socket.disconnect(true);
					console.log("disconnected-user doesn't exist");
				}else if(data.sessionCode != res.sessionCode){//session code is wrong
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
					socket.disconnect(true);
					console.log("disconnected-wrong sessionCode");
				}else if(Date.now()-res.sessionCodeTime>3600000){//more than one hour since activity
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:1});
					socket.disconnect(true);
					console.log("disconnected-session expired");
				}else if(res.active){//already active on another page
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:2});
					socket.disconnect(true);
					console.log("disconnected-already active");
				}else{//authorized
					username = data.username;
					socket.emit("authorizeUserResponse", {authorized:true});
					console.log(username+" was authorized");
					dbo.collection("profile").updateOne({username:username},{$set:{sessionCodeTime:Date.now(),active:true}}, function(err, res){
						if (err) throw err;//updates time
					});
				}
			});
		});
	});
	socket.on("joinRandom", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("profile").findOne({username:username}, function(err, resProfile) {
				if(!resProfile){//not logged in
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
					socket.disconnect(true);
					console.log("disconnected-username doesn't exist");
				}else if(resProfile.gameNum){//already in a game
					socket.emit("alreadyInGame");
				}else{
					var userGameNum;
					dbo.collection("games").findOne({available:true,code:null}, function(err, resGames) {
						if (err) throw err;
						if(resGames){//joins existing game
							userGameNum = resGames.gameNum;
							var gameNumTarget = {gameNum:userGameNum};
							var newData = {$set:{users:[resGames.users[0],username], available:false, time:Date.now()}};
							socket.join("room"+userGameNum);
							socket.to("room"+userGameNum).emit("playerFound");
							dbo.collection("games").updateOne(gameNumTarget, newData, function(err, updateres){
								if (err) throw err;
								socket.emit("goToGame", {wait:false});
								console.log(username + " joined game number" + userGameNum);
							});
							dbo.collection("profile").updateOne({username:username}, {$set:{gameNum:userGameNum}}, function(err, updateres){
								if (err) throw err;
							});
						}else{//starts game and waits for another player user
							userGameNum = gameNum++;
							player1or2 = 1;
							dbo.collection("games").insertOne({gameNum:userGameNum, users:[username,null], code:null, available:true, receivedStartGameLocations:[false,false], gameover:false, allies:[null,null]}, function(err, res){
								if (err) throw err;
								socket.emit("goToGame", {wait:true});
								socket.join("room"+userGameNum);
								console.log(username + " is waiting for player on game number " + userGameNum);
							});
							dbo.collection("profile").updateOne({username:username}, {$set:{gameNum:userGameNum}}, function(err, updateres){
								if (err) throw err;
							});
						}
					});
				}
			});
		});
	});
	socket.on("disconnect", function(data){
		console.log("disconnected /lobby");
		if(username){
			MongoClient.connect(mongourl, function(err, db) {
				if (err) throw err;
				var dbo = db.db("squarebattle");
				dbo.collection("profile").updateOne({username:username},{$set:{active:false}}, function(err, res){
					if (err) throw err;//updates active to false
				});
			});
		}
	});
});

io.of("/game").on("connection", function(socket){
	console.log("connected /game");
	var username;
	var userGameNum;
	var userNumber;
	var confirmUsername = setTimeout(function(){
		socket.emit("slowconnection");
		socket.disconnect(true);
		console.log("disconnected");
	}, 1000);
	socket.on("authorizeUser", function(data){
		clearTimeout(confirmUsername); 
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("profile").findOne({username:data.username}, function(err, res) {
				if (err) throw err;
				if(!res){//username doesn't exist
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
					socket.disconnect(true);
					console.log("disconnected-user doesn't exist");
				}else if(data.sessionCode != res.sessionCode){//session code is wrong
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
					socket.disconnect(true);
					console.log("disconnected-wrong sessionCode");
				}else if(Date.now()-res.sessionCodeTime>3600000){//more than one hour since activity
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:1});
					socket.disconnect(true);
					console.log("disconnected-session expired");
				}else if(res.active){//already active on another page
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:2});
					socket.disconnect(true);
					console.log("disconnected-already active");
				}else if(!res.gameNum){//already active on another page
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:3});
					socket.disconnect(true);
					console.log("disconnected-not in game");
				}else{//authorized
					username = data.username;
					userGameNum = res.gameNum;
					socket.emit("authorizeUserResponse", {authorized:true});
					console.log(username+" was authorized");
					dbo.collection("profile").updateOne({username:username},{$set:{sessionCodeTime:Date.now(),active:true}}, function(err, res){
						if (err) throw err;//updates time
					});
				}
			});
		});
	});
	socket.on("getGameInfo", function(data){
		if(!username||!userGameNum){
			socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
			socket.disconnect(true);
			console.log("disconnected");
		}else{
			socket.join("room"+userGameNum);
			MongoClient.connect(mongourl, function(err, db) {
				if (err) throw err;
				var dbo = db.db("squarebattle");
				dbo.collection("games").findOne({gameNum:userGameNum}, function(err, res) {
					if (err) throw err;
					console.log(res.users[0]);
					if(res.users[0]==username){
						userNumber=0;
					}else{
						userNumber=1;
					}
					socket.emit("getGameInfoResponse", {otherPlayer:res.users[(userNumber+1)%2], time:res.time, userNumber:userNumber});
				});
			});
		}
	});
	//transfers game info to other player at begining
	socket.on("startGameLocations", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("games").findOne({gameNum:userGameNum}, function(err, res) {
				if (err) throw err;
				res.allies[userNumber]=data.allies;
				res.receivedStartGameLocations[userNumber]=true;
				dbo.collection("games").updateOne({gameNum:userGameNum},{$set:res}, function(err, res2){
					if (err) throw err;//submits data
					console.log("player"+userNumber+" added");
					if(res.receivedStartGameLocations[(userNumber+1)%2]){
						io.of("/game").to("room"+userGameNum).emit("startGameLocationsResponse", res.allies);
						console.log("locationsSent!");
					}
				});
			});
		});
	});
	//updates new locations in table
	socket.on("turnSwitch", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			socket.to("room"+userGameNum).emit("yourTurn", data);
		});
	});
	socket.on("gameOver", function(data){//ends game and sends final data back
		socket.to("room"+userGameNum).emit("loserhaha", data.allies);
		console.log(username+" wins!!!");
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("games").findOne({gameNum:userGameNum}, function(err, res) {
				if (err) throw err;
					dbo.collection("profile").updateOne({username:res.users[(userGameNum+1)%2]},{$set:{gameNum:null}}, function(err, res) {
						if (err) throw err;
					});
			});
			dbo.collection("games").deleteOne({gameNum:userGameNum}, function(err, res) {
				if (err) throw err;
			});
			dbo.collection("profile").updateOne({username:username},{$set:{gameNum:null}}, function(err, res) {
				if (err) throw err;
			});
		});
	});
	socket.on("disconnect", function(data){
		console.log("disconnected /game");
		if(username){
			MongoClient.connect(mongourl, function(err, db) {
				if (err) throw err;
				var dbo = db.db("squarebattle");
				dbo.collection("profile").updateOne({username:username},{$set:{active:false}}, function(err, res){
					if (err) throw err;//updates active to false
				});
			});
		}
	});
});


/*
io.sockets.on('connection', function(socket){
	console.log(server);
	console.log("connected "+server.pathname);
	var username = null;
	var userGameNum;
	var player1or2;
	var confirmUsername = setTimeout(function(){
		socket.emit("slowconnection");
		socket.disconnect(true);
		console.log("disconnected");
	}, 1000);
	socket.on("disconnect", function(data){
		console.log("disconnected");
		if(username){
			MongoClient.connect(mongourl, function(err, db) {
				if (err) throw err;
				var dbo = db.db("squarebattle");
				dbo.collection("profile").updateOne({username:username},{$set:{active:false}}, function(err, res){
					if (err) throw err;//updates time
				});
			});
		}
	});
	//checks to make sure user is a user
	socket.on("authorizeUser", function(data){
		clearTimeout(confirmUsername); 
		if(!data.signinorup){
			MongoClient.connect(mongourl, function(err, db) {
				if (err) throw err;
				var dbo = db.db("squarebattle");
				dbo.collection("profile").findOne({username:data.username}, function(err, res) {
					if (err) throw err;
					if(!res){//username doesn't exist
						socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
						socket.disconnect(true);
						console.log("disconnected");
					}else if(data.sessionCode != res.sessionCode){//session code is wrong
						socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
						socket.disconnect(true);
						console.log("disconnected");
					}else if(Date.now()-res.sessionCodeTime>3600000){//more than one hour since activity
						socket.emit("authorizeUserResponse", {authorized:false, errorCode:1});
						socket.disconnect(true);
						console.log("disconnected");
					}else if(data.active){//already active on another page
						socket.emit("authorizeUserResponse", {authorized:false, errorCode:2});
						socket.disconnect(true);
						console.log("disconnected");
					}else{//authorized
						username = data.username;
						socket.emit("authorizeUserResponse", {authorized:true});
						isUser = true;
						console.log(username+" was authorized");
						dbo.collection("profile").updateOne({username:username},{$set:{sessionCodeTime:Date.now(),active:true}}, function(err, res){
							if (err) throw err;//updates time
						});
					}
				});
			});
		}
	});
	//signs people up
	socket.on("signUp", function(data){
		var sameUser = false;
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("profile").findOne({username:data.username}, function(err, res) {
				if (err) throw err;
				if(res){//username was taken
					socket.emit("signUpResponse", {authorized:false,errorCode:0});
					console.log("signup failed");
				}else if(data.username.length<1||data.username.length>15){//username is correct length
					socket.emit("signUpResponse", {authorized:false,errorCode:1});
					console.log("signup failed");
				}else if(data.password.length<8||data.password.length>20){//password is correct length
					socket.emit("signUpResponse", {authorized:false,errorCode:2});
					console.log("signup failed");
				}else{//successful signup
					var userdata = {};
					userdata.username = data.username;
					userdata.password = passwordHash.generate(data.password);
					userdata.sessionCode = Math.floor(Math.random() * 9000000000 ) + 1000000000;
					userdata.sessionCodeTime = Date.now();
					dbo.collection("profile").insertOne(userdata, function(err, res) {
						if (err) throw err;
						console.log("user added");
						socket.emit("signUpResponse", {authorized:true,sessionCode:userdata.sessionCode});
					});
				}
			});
		});
	});
	//signs in
	socket.on("signIn", function(data){
		if(data.username.length>15){
			socket.emit("signInResponse", {authorized:false,errorCode:0});
			console.log("failed signin");
		}else{
			MongoClient.connect(mongourl, function(err, db) {
				if (err) throw err;
				var dbo = db.db("squarebattle");
				dbo.collection("profile").findOne({username:data.username}, function(err, res) {
					if (err) throw err;
					if(!res){//username does not exist
						socket.emit("signInResponse", {authorized:false,errorCode:0});
						console.log("failed signin");
					}else if(!passwordHash.verify(data.password, res.password)){//incorrect password
						socket.emit("signInResponse", {authorized:false,errorCode:0});
						console.log("failed signin");
					}else if(!passwordHash.verify(data.password, res.password)){//incorrect password
						socket.emit("signInResponse", {authorized:false,errorCode:0});
						console.log("failed signin");
					}else if(res.active){//already signed in on other page
						socket.emit("signInResponse", {authorized:false,errorCode:1});
						console.log("failed signin");
					}else{//successful login
						var sessionCode = Math.floor(Math.random() * 9000000000 ) + 1000000000;
						dbo.collection("profile").updateOne({username:data.username},{$set:{sessionCode:sessionCode,sessionCodeTime:Date.now()}}, function(err, res){
							if (err) throw err;//submits data
								console.log("successful login");
								socket.emit("signInResponse", {authorized:true,sessionCode:sessionCode});//returns success
						});
					}
				});
			});
		}
	});
	//joins or starts random game
	socket.on("joinRandom", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("profile").findOne({username:username}, function(err, resProfile) {
				if(!resProfile){//not logged in
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
					socket.disconnect(true);
					console.log("disconnected");
				}else if(resProfile.gameNum){//already in a game
					socket.emit("alreadyInGame", {});
				}else{
					dbo.collection("games").findOne({player2:null,code:null}, function(err, resGames) {
						if (err) throw err;
						if(resGames){//joins existing game
							userGameNum = resGames.gameNum;
							player1or2 = 2;
							var gameNumTarget = {gameNum:userGameNum};
							var newData = {$set:{player2:username, time:Date.now()}};
							socket.join("room"+userGameNum);
							socket.to("room"+userGameNum).emit("playerFound");
							dbo.collection("games").updateOne(gameNumTarget, newData, function(err, updateres){
								if (err) throw err;
								socket.emit("goToGame", {wait:false});
								console.log(username + " joined game number" + userGameNum);
							});
							dbo.collection("profile").updateOne({username:username}, {$set:{gameNum:userGameNum}}, function(err, updateres){
								if (err) throw err;
							});
						}else{//starts game and waits for another player user
							userGameNum = gameNum++;
							player1or2 = 1;
							dbo.collection("games").insertOne({gameNum:userGameNum, player1:username, player2:null, code:null, turn:1, turnnumber:0, gameover:false}, function(err, res){
								if (err) throw err;
								socket.emit("goToGame", {wait:true});
								socket.join("room"+userGameNum);
								console.log(username + " is waiting for player on game number " + userGameNum);
							});
							dbo.collection("profile").updateOne({username:username}, {$set:{gameNum:userGameNum}}, function(err, updateres){
								if (err) throw err;
							});
						}
					});
				}
			});
		});
	});
	//joins coded game
	socket.on("joincode", function(data){
		console.log("join recieved");
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			var done = false;
			dbo.collection("waiting").find({}).toArray(function(err, res) {
				if (err) throw err;
				var joinagame = false;
				for(i=0;i<res.length;i++){//checks if use is already in a game
					if(res[i].player1==data.username||res[i].player2==data.username){
						joinagame=true;
						socket.emit("gotogame", {conf:true});
						console.log("already in game");
						i=res.length;
					}
				}
				for(i=0;i<res.length&&!joinagame;i++){//checks if code is valid
					console.log(res[i].code);
					if(res[i].code==data.code&&res[i].player2==null){
						console.log(res[i].code);
						joinagame = true;
						var starttime = Date.now();
						socket.join(res[i].gamenum);
						socket.to(res[i].gamenum).emit("gotogame");
						dbo.collection("waiting").updateOne({code:data.code},{$set:{gamenum:gamenum,player2:data.username, time:starttime}}, function(err, res){
							if (err) throw err;
							socket.emit("gotogame", {conf:true});
							console.log("joined game");
						});
					}
					if(res.length-i==1){
						done = true;
					}
				}
				var makeitsync = setInterval(function(){//sends to game
					if(done){
						if(!joinagame){
							socket.emit("gotogame", {conf:false});
						}
						clearInterval(makeitsync);
					}
				}, 500);
			});
		});
	});
	//creates coded game
	socket.on("createcode", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("waiting").find({}).toArray(function(err, res) {
				if (err) throw err;
				var joinagame = false;
				for(i=0;i<res.length;i++){
					if(res[i].player1==data.username||res[i].player2==data.username){//checks if user is already in game
						joinagame=true;
						socket.emit("gotogame", {});
						console.log("already in game");
						i=res.length;
					}
				}
				if(!joinagame){
					var code = Math.floor(Math.random()*1000000);//creates code
					dbo.collection("waiting").find({}).toArray(function(err, res) {
						if (err) throw err;
						var works = false;
						while(!works){//check if code is already being used
							works = true;
							for(i==0;i<res.length;i++){
								if(res[i].code == code){
									works=false;
								}
							}
						}
					});
					gamenum++;
					socket.join(gamenum);
					dbo.collection("waiting").insertOne({gamenum:gamenum, code:code, player1:data.username, player2:null, turn:1, turnnumber:0, gameover:false}, function(err, res){
						if (err) throw err;
						socket.emit("getcode", {code:code});//submits code
						joinagame = true;
						console.log("created code");
					});
				}
			});
		});
	});
	//gets info on the game
	socket.on("getGameInfo", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("profile").findOne({username:username}, function(err, resProfile) {
				if(!resProfile){//not logged in
					socket.emit("authorizeUserResponse", {authorized:false, errorCode:0});
					socket.disconnect(true);
					console.log("disconnected");
				}else if(!resProfile.gameNum){//not in a game
					socket.emit("notInGame", {});
				}else{
					dbo.collection("games").findOne({$or:[{player1:username},{player2:username}]}, function(err, resGames) {
						if (err) throw err;
						socket.join("room"+resGames.gameNum);
						userGameNum = resGames.gameNum;
						if(resGames.player1==username){
							socket.emit("getGameInfoResponse", {otherPlayer:resGames.player2, time:resGames.time, p1:true});
						}else{
							socket.emit("getGameInfoResponse", {otherPlayer:resGames.player1, time:resGames.time, p1:false});
						}
					});
				}
			});
		});
	});
	//transfers game info to other player at begining
	socket.on("startGameLocations", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("games").findOne({gameNum:userGameNum}, function(err, res) {
				if (err) throw err;
				if(player1or2==1){
					dbo.collection("games").updateOne({player1:data.username},{$set:{p1allies:data.allies, turnnumber:0}}, function(err, res){
						if (err) throw err;//submits data
						console.log("player1 added");
					});
					socket.to("room"+userGameNum).emit("startGameLocationsResponse", {enemies:data.allies,first:true});
				}else{
					dbo.collection("games").updateOne({player2:data.username},{$set:{p2allies:data.allies, turnnumber:0}}, function(err, res){
						if (err) throw err;//submits data
						console.log("player1 added");
					});
					socket.to("room"+userGameNum).emit("startGameLocationsResponse", {enemies:data.allies,first:false});
				}
			});
		});
	});
	//submits whose turn it is on request
	socket.on("findTurn", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			dbo.collection("waiting").find({}).toArray(function(err, res) {
				if (err) throw err;
				for(i=0;i<res.length;i++){
					if(res[i].player1==data.username){
						if(res[i].turn==1){
							socket.emit("go", {allies:res[i].p1allies, enemies:res[i].p2allies});
						}
					}else if(res[i].player2==data.username){
						if(res[i].turn==2){
							socket.emit("go", {allies:res[i].p2allies, enemies:res[i].p1allies});
						}
					}
				}
			});
		});
	});
	//updates new locations in table
	socket.on("turnSwitch", function(data){
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			socket.to("room"+userGameNum).emit("yourTurn", {allies:data.enemies, enemies:data.allies});
			dbo.collection("games").findOne({gameNum:userGameNum}, function(err, res) {
				if (err) throw err;
				for(i=0;i<res.length;i++){
					if(res[i].player1==data.username){//if user is player 1
						dbo.collection("waiting").updateOne({player1:data.username},{$set:{p1allies:data.allies, p2allies:data.enemies, time:Date.now()+7000, turn:2}}, function(err, res){
							if (err) throw err;//submits data
							console.log("player1 added");
						});
					}else if(res[i].player2==data.username){//if user is player 2
						dbo.collection("waiting").updateOne({player2:data.username},{$set:{p2allies:data.allies, p1allies:data.enemies, time:Date.now()+7000, turn:1}}, function(err, res){
							if (err) throw err;//submits data
							console.log("player2 added");
						});
					}
					socket.to(res[i].gamenum).emit("go", {allies:data.enemies, enemies:data.allies});
				}
			});
		});
	});
	socket.on("gameOver", function(data){//ends game and sends final data back
		MongoClient.connect(mongourl, function(err, db) {
			if (err) throw err;
			var dbo = db.db("squarebattle");
			socket.to(res[i].gamenum).emit("loserhaha", {allies:data.enemies, enemies:data.allies});
			console.log(username+" wins!!!");
			/*dbo.collection("waiting").find({}).toArray(function(err, res) {
				if (err) throw err;
				for(i=0;i<res.length;i++){
					if(res[i].player1==data.username){//if user is player 1
						socket.to(res[i].gamenum).emit("loserhaha", {allies:data.enemies, enemies:data.allies});
						dbo.collection("waiting").updateOne({player1:data.username},{$set:{p1allies:data.allies, p2allies:data.enemies, gameover:true}}, function(err, res){
							if (err) throw err;//submits data
							console.log("P1 Wins");
						});
					}else if(res[i].player2==data.username){//if user is player 2
						socket.to(res[i].gamenum).emit("loserhaha", {allies:data.enemies, enemies:data.allies});
						dbo.collection("waiting").updateOne({player2:data.username},{$set:{p2allies:data.allies, p1allies:data.enemies, gameover:true}}, function(err, res){
							if (err) throw err;//submits data
							console.log("P2 Wins");
						});
					}
				}
			});
		});
	});
});*/
console.log("Go");