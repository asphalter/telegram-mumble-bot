var config = require('./config');
var express = require('express');
var bodyParser = require('body-parser');
var TelegramBot = require('telegrambot');
var Mumble = require('mumble');
var http = require('http');
var fs = require('fs');

// TELEGRAM SETUP
var api = new TelegramBot(config.TELEGRAM_TOKEN);
api.setWebhook({url: config.WEBHOOK_BASE_URL+config.WEBHOOK_PATH}, function(err, message) {
  if (err) {
    console.log(err);
  } else {
    console.log('Telegram webhook set');
  }
});

// MUMBLE SETUP
var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
var mumbleClient;

// SERVER SETUP
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./'));
app.get('/', function status(req, res, next) {
  res.json({ status: 'UP' });
});
app.post(config.WEBHOOK_PATH, function(req, res) {
  if (!req.hasOwnProperty('body')) {
    return res.send();
  }
  var body = req.body;
  if (body.hasOwnProperty('message')) {
    readCommand(body.message);
  }
  res.send();
});
var server = app.listen(config.SERVER_PORT, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server listening at http://%s:%s', host, port);
});

var mumbleConnect = function() {
    Mumble.connect(config.MUMBLE_URL, options, function(error, client) {
      if (error) {
        console.log(error);
        return;
      }
      console.log('Connected to Mumble.');
      mumbleClient = client;
      client.authenticate(config.MUMBLE_USER, config.MUMBLE_PASSWORD);
      client.on('initialized', onInit);
      client.on('user-connect', onUserConnected);
      client.on('user-disconnect', onUserDisconnected);
      client.on('message', onMessage);
      client.on('error', onError);
    });
}

var readCommand = function(message) {
  console.log('Reading command...');
  console.log(message);
  if (message) {
    if (message.text !== undefined) {
      if (message.text === '/start') {
        api.sendMessage({ chat_id: message.chat.id, text: 'Ciao' }, function (err, message) {
          if (err) {
            console.log(err);
          }
        });
      } else if (message.text.startsWith('/mumble')) {
        console.log('reconnecting to mumble');
        api.sendMessage({ chat_id: config.TELEGRAM_CHAT_ID, text: 'Aspetta, mi ricollego subito a Mumble. Chi ha scritto la mia libreria è un NoooooB e non mi ricollego da solo.' }, function (err, message) {
            if (err) {
              console.log(err);
            }
        });
        mumbleConnect();
      }
    } else {
      console.log('Message text missing');
    }
  } else {
    console.log('Message missing');
  }
};

// MUMBLE LISTENER FUNCTIONS
var usersList = [];
var onInit = function() {
  console.log('Mumble connection initialized');
  usersList = mumbleClient.users();
};

mumbleConnect();

var onUserConnected = function(user) {
  console.log(user.name + ' connected');
  usersList.push(user);
  console.log('Current users list:');
  usersList.forEach(function(user) {
    console.log(user.name + '\n');
  });
  //if ((user.name).toLowerCase().includes('rik') || (user.name).toLowerCase().includes('coniglio') || (user.name).toLowerCase().includes('rabbit') || (user.name).toLowerCase().includes('rosso') || (user.name).toLowerCase().includes('red')) {
  //    lolname = 'Zerby';
  //} else {
  //    lolname = user.name;
  //}
  var messageText = user.name + ' si è appena connesso a Mumble';
  api.sendMessage({ chat_id: config.TELEGRAM_CHAT_ID, text: messageText }, function (err, message) {
    if (err) {
      console.log(err);
    }
  });
  if ((user.name).toLowerCase().includes('rik') || (user.name).toLowerCase().includes('coniglio') || (user.name).toLowerCase().includes('rabbit') || (user.name).toLowerCase().includes('rosso') || (user.name).toLowerCase().includes('red')) {
      api.sendPhoto({ chat_id: config.TELEGRAM_CHAT_ID, caption: '(Foto illustrativa)', photo: 'zerby.jpg' }, function (err, message) {
        if (err) {
          console.log(err);
        }
      });
  }
};

var onUserDisconnected = function(userDisconnected) {
  console.log(userDisconnected.name + ' disconnected');
  usersList = usersList.filter(function(user) {
    return user.name != userDisconnected.name;
  });
  console.log('Current users list:');
  usersList.forEach(function(user) {
    console.log(user.name);
  });
  //if ((userDisconnected.name).toLowerCase().includes('rik') || (userDisconnected.name).toLowerCase().includes('coniglio') || (userDisconnected.name).toLowerCase().includes('rabbit') || (userDisconnected.name).toLowerCase().includes('rosso') || (userDisconnected.name).toLowerCase().includes('red')) {
  //    lolname = 'Zerby';
  //} else {
  //    lolname = userDisconnected.name;
  //}
  var messageText = userDisconnected.name + ' si è appena disconnesso da Mumble';
  api.sendMessage({ chat_id: config.TELEGRAM_CHAT_ID, text: messageText }, function (err, message) {
    if (err) {
      console.log(err);
    }
  });
};

var onMessage = function (message, user) {
  console.log('Mumble message received');
  console.log(user.name + ' : ' + message);
  api.sendMessage({ chat_id: config.TELEGRAM_CHAT_ID, text: user.name + ' : ' + message }, function (err, message) {
    if (err) {
      console.log(err);
    }
  });
};

var onError = function (error) {
  console.log('Mumble error:');
  console.log(error);
  api.sendMessage({ chat_id: config.TELEGRAM_CHAT_ID, text: 'ERROR: ' + error }, function (err, message) {
    if (err) {
      console.log(err);
    }
  });
};
