var http = require('http');
var fs = require('fs');
const mongo = require('mongodb').MongoClient;
//const client = require('socket.io').listen(5000).sockets;

// Loading the index file . html displayed to the client
var server = http.createServer(function(req, res) {
  fs.readFile('./dist/index.html', 'utf-8', function(error, content) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(content);
  });
});

var client = require('socket.io').listen(server);

// Connect to mongo
mongo.connect('mongodb://mongouser:boxing123@ds121495.mlab.com:21495/mongochat_db', function(err, db){
  if (err) {
    throw err;
  }

  console.log('MongoDB connected...');

  // Connect to Socket.io
  client.on('connection', function(socket){

    let chat = db.collection('chats');

    // Create function to send status
    sendStatus = function(s){
      socket.emit('status', s);
    }

    // Get chats from mongo collection
    chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
      if (err){
        throw err;
      }

      // Emit the messages
      socket.emit('output', res);
    });

    // Handle input events
    socket.on('input', function(data){
      let name = data.name;
      let message = data.message;

      // Check for name and message
      if (name == '' || message == '') {
        // Send error status
        sendStatus('Please enter a name and message');
      } else {
        // Insert message
        chat.insert({name: name, message: message}, function(){
          client.emit('output', [data]);

          // Send status object 
          sendStatus({
            message: 'Message sent',
            clear: true
          });
        });
      }
    });

    // Handle clear
    socket.on('clear', function(data){
      // Remove all chats from collection
      chat.remove({}, function(){
        // Emit cleared
        socket.emit('cleared');
      });
    });

  });
});

server.listen(process.env.PORT || 5000);

console.log('Listening to port: ' + process.env.PORT);