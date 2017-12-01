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
    destruct(message.channel.name, message.content);
    if (msg_channel(message.channel.name, message.content)) {
      message.channel.send("test");
    }
  });

client.login(token);

function destruct(channel, msg) {
  if (msg.lenght < 2) {
    return;
  }
  var msg_t = msg.split(" ");
  console.log(msg_t);
  if (!db["channel"]) {
    db["channel"] = {};
  }
  if (!db["name"]) {
    db["name"] = {};
  }
  for (var w1 in msg_t) {
    words = [msg_t[w1]];
    if (!db[msg_t[w1]]) {
      db["word"][msg_t[w1]] = {};
      db["word"][msg_t[w1]]["channel"] = {}
      db["word"][msg_t[w1]]["name"] = msg_t[w1];
    }
    for (var w2 in db) {
      if (comp(msg_t[w1], db["word"][w2]["name"]) < config.matchn) {
        console.log(msg_t[w1], db["word"][w2]["name"]);
        words.push(db["word"][w2]["name"]);
      }
    }
    for (var w2 in words) {
      if (!db["channel"][channel]) {
        db["channel"][channel] = 0;
      }
      if (!db["word"][words[w2]]["channel"][channel]) {
        db["word"][words[w2]]["channel"][channel] = 0;
      }
      db["channel"][channel] += 1;
      db["word"][words[w2]]["channel"][channel] += 1;
    }
  }
  fs.writeFileSync(config.webroot + "/db.json", JSON.stringify(db));
}

function comp(w1 = "", w2 = "") {
  var s = 0;
  var word1 = JSON.parse(fs.readFileSync('word.json'));
  var w1_t = w1.toLowerCase().split("");
  var word2 = JSON.parse(fs.readFileSync('word.json'));
  var w2_t = w2.toLowerCase().split("");

  for (var l in w1_t) {
    word1[w1_t[l]] += 1;
  }

  for (var l in w2_t) {
    word2[w2_t[l]] += 1;
  }

  for (var l in word1) {
    s += Math.pow(word1[l] - word2[l], 2);
  }
  return s;
}

function msg_channel(channel, msg) {
  msg_t = msg.split(" ");
  msg_c = 0;
  channel_c = 0;
  count = 0;
  for (w in msg_t) {
    ++msg_c;
    nc = db["word"][msg_t[w]]["channel"][channel] / db["channel"][channel];
    for (c in db["channel"]) {
      if (!db["channel"][c]) {
        db["channel"][c] = 0;
      }
      if (!db["word"][msg_t[w]]["channel"][c]) {
        db["word"][msg_t[w]]["channel"][c] = 0;
      }
      ++channel_c;
      if (db["word"][msg_t[w]]["channel"][c] / db["channel"][c] > nc) {
        ++count;
      }
    }
  }
  console.log(count);
  if (2 * count >= channel_c * msg_c) {
    return true;
  }
  return false;
}
