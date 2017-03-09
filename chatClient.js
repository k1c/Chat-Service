var userName;

$(document).ready(function(){

  userName = prompt("What's your name?")||"User";

  var socket = io(); //connect to the server that sent this page
  socket.on('connect', function(){
    socket.emit("intro", userName);
  });

  $('#inputText').keypress(function(ev){
      if(ev.which===13){
        //send message
        socket.emit("message",$(this).val());
        ev.preventDefault(); //if any
        $("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
        $(this).val(""); //empty the input
      }
  });

  socket.on("message",function(data){
    $("#chatLog").append(data+"\n");
    $('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
  });

  socket.on("userList",function(data){
    $('#userList').empty();

    for(var i=0; i<data.users.length;i++){   //data={users:["Matilda","Joe","Timmy"]};
       var listItem = $("<li>"+data.users[i]+"</li>");

       listItem.on('dblclick',function(ev){

        if(ev.metaKey || ev.ctrlKey){   //contol key will work on WINDOWS. metaKey works on MAC
          console.log("blocking user");
          socket.emit("blockUser",{username:$(this).text()});

        }else{
          var privateMessage = prompt("Send private message to " + $(this).text());
          if (privateMessage && privateMessage.length !== 0){
            socket.emit("privateMessage",{username:$(this).text(),message:privateMessage});
          }
        }
      });

      $('#userList').append(listItem);
    }
  });

  socket.on("privateMessage",function(data){
    var reply = prompt("Private Message from " + data.username + ":\n" + data.message + "\nReply:");
    if (reply && reply.length !== 0){
      socket.emit("privateMessage",{username:data.username,message:reply});
    }

  });
});
