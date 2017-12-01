const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json')
const client = new Discord.Client();

const db = JSON.parse(fs.readFileSync(config.webroot + "/db.json"));
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
  console.log(msg_t);
  for (var w1 in msg_t) {
    words = [msg_t[w1]];
    if (!db[msg_t[w1]]) {
      db[msg_t[w1]] = 0;
    }
    for (var w2 in db) {
      db_t = Object.keys(db);
      if (comp(msg_t[w1], db_t[w2]) < 10) {
        console.log(msg_t[w1], db_t[w2]);
        words.push(db_t[w2]);
      }
    }
    for (w2 in words) {
      db[words[w2]] += 1;
    }
  }
  fs.writeFileSync(config.webroot + "/db.json", JSON.stringify(db));
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
