const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json')
const client = new Discord.Client();

const db = JSON.parse(fs.readFileSync("db.json"));
const token = config.token;

var adminProfile = JSON.parse(fs.readFileSync(config.webroot + "/adminProfile.json"));

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('userUpdate',
  (oldUser, newUser) => {
    adminProfile[newUser.id] = {};
    adminProfile[newUser.id]['username'] = newUser.username;
    adminProfile[newUser.id]['avatarURL'] = newUser.avatarURL;
    fs.writeFile(config.webroot + "/adminProfile.json", JSON.stringify(adminProfile), function(err) {
      if (err) {
        return console.log(err);
      }
    });
  });

client.on('guildMemberUpdate',
  (oldMember, newMember) => {
    adminProfile[newMember.user.id] = {};
    adminProfile[newMember.user.id]['username'] = newMember.user.username;
    adminProfile[newMember.user.id]['avatarURL'] = newMember.user.avatarURL;
    fs.writeFile(config.webroot + "/adminProfile.json", JSON.stringify(adminProfile), function(err) {
      if (err) {
        return console.log(err);
      }
    });
  });

client.on('message',
  (message) => {
      destruct(message.content);
  });

client.login(token);

function destruct(msg) {
  var msg_t = msg.split(" ");
  for (var w1 in msg) {
    for (var w2 in db) {
      if ( comp(w1,w2) < 10 ) {
        Console.log(w1 + " " + w2)
      }
    }
  }
}

function comp(w1, w2) {
  var s = 0;
  var word1 = JSON.parse(fs.readFileSync('word.json'));
  var word2 = JSON.parse(fs.readFileSync('word.json'));

  for (var l in w1) {
    if (word1[l]) {
      word1[l] += 1;
    }
  }

  for (var l in w2) {
    if (word2[l]) {
      word2[l] += 1;
    }
  }

  for (var l in word1) {
    s += Math.pow((word1[l] - word2[l]), 2);
  }
  return s;
}
