var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var mime = require('mime-types');
var url =require('url');

http.listen(2406);

console.log("Chat server listening on port 2406");

const ROOT = "./public_html";

function handler(req,res){

	//process the request
	console.log(req.method+" request for: "+req.url);

	//parse the url
	var urlObj = url.parse(req.url);
	var filename = ROOT+urlObj.pathname;

	//the callback sequence for static serving...
	fs.stat(filename,function(err, stats){
		if(err){   //try and open the file and handle the error, handle the error
			res.writeHead(404);
			res.end("404!!! File or folder not found")
		}else{
			if(stats.isDirectory())	filename+="/index.html";

			fs.readFile(filename,"utf8",function(err, data){
				if(err){
					res.writeHead(500);
					res.end("500!!! Server error")
				}else{
					res.writeHead(200,{'content-type':mime.lookup(filename)||'text/html'});
					res.end(data);
				}
			});
		}
	});

};

var clients = [];  //contains list of sockets (where each socket is a unique user)

io.on("connection", function(socket){  //socket is unique connection between username and server
	console.log("Got a connection");

	socket.on("intro",function(data){
		socket.username = data;  //attach the socket.username to the socket object
		socket.blockedList = [];
		clients.push(socket);
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		socket.emit("message","Welcome, "+socket.username+".");
		io.emit("userList",{users:getUserList()});

	});

	socket.on("message", function(data){
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data);

	});

	socket.on("privateMessage", function(data){  //socket is user sending message
		console.log("got private message from "+socket.username+" to "+data.username+": "+data.message);

		//Find user socet
		var userSocket;

		for(var i=0; i<clients.length; i++){
			if(data.username === clients[i].username){
				userSocket = clients[i];
				break;
			}
		}

    if(userSocket.blockedList.length === 0 || userSocket.blockedList.indexOf(socket.username) === -1){
    	userSocket.emit("privateMessage",{username:socket.username,message:data.message})
	  }
	});

	socket.on("blockUser", function(data){
		if (socket.blockedList.indexOf(data.username) == -1){
	    socket.blockedList.push(data.username);
			socket.emit("message",data.username+" has been blocked.");
		}else{
		  socket.blockedList = socket.blockedList.filter(function(ele){
				 return ele !== data.username;
			});
			socket.emit("message",data.username+" has been unblocked.");
		}
	});

	socket.on("disconnect", function(){
		clients = clients.filter(function(ele){
       return ele!==socket;     //socket is the one that disconnect
			                          //the users that remain in the array have passed the test
    });

	  io.emit("userList",{users:getUserList()});
	  console.log(socket.username+" disconnected");
	  io.emit("message", timestamp()+": "+socket.username+" disconnected.");
	});

});

function getUserList(){
    var ret = [];
    for(var i=0;i<clients.length;i++){
        ret.push(clients[i].username);
    }
    return ret;
}

function timestamp(){
	return new Date().toLocaleTimeString();
}
