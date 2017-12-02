const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json')
const client = new Discord.Client();

const db = JSON.parse(fs.readFileSync(config.webroot + "/db.json"));
const token = config.token;

var adminProfile = JSON.parse(fs.readFileSync(config.webroot + "/adminProfile.json"));
var buff = JSON.parse('{}');
var time_count = JSON.parse('{}');

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
    var msg = message.content.split(" ");
    var channel_name = message.channel.name;
    if (!time_count[channel_name]) {
      time_count[channel_name] = {};
      time_count[channel_name]["count"] = 10;
      time_count[channel_name]["sendable"] = true;
    }
    if (!buff[channel_name]) {
      buff[channel_name] = [];
    }
    for (w in msg) {
      buff[channel_name][msg[w]] = msg[w];

    }
    while (buff[channel_name].lenght > 64) {
      delete buff[channel_name][0];
    }
    if (msg[0] == '<@385867044127637509>' && !msg[1]) {
      var corrected = false
      while (msg_channel(channel_name, buff[channel_name], false) != channel_name) {
        for (w in buff[channel_name]) {
          ++db["word"][buff[channel_name][w]]["channel"][channel_name]["count"];
          ++db["channel"][channel_name]["count"];
        }
        corrected = true;
      }
      console.log(channel_name + " corrected:", corrected);
    } else {
      if (!message.author.bot) {
        console.log(channel_name, ":", message.content);
        destruct(channel_name, message.content);
        if (!time_count[channel_name]["sendable"]) {
          --time_count[channel_name]["count"];
        }
        if (time_count[channel_name]["count"] == 0) {
          time_count[channel_name]["count"] = 10;
          time_count[channel_name]["sendable"] = true;
        }
        var channel = msg_channel(channel_name, buff[channel_name]);
        if (channel !== channel_name) {
          if (time_count[channel_name]["sendable"]) {
            message.channel.send("Le channel #" + channel + " est plus adapté à votre conversation. ^^");
            time_count[channel_name]["sendable"] = false;
          }
        }
      }
    }
  });

client.login(token);

function destruct(channel, msg) {
  var msg_t = msg.split(" ");
  if (!db["channel"]) {
    db["channel"] = {};
  }
  if (!db["word"]) {
    db["word"] = {};
  }
  for (var w1 in msg_t) {
    words = [msg_t[w1]];
    if (!db["word"][msg_t[w1]]) {
      db["word"][msg_t[w1]] = {};
      db["word"][msg_t[w1]]["channel"] = {}
      db["word"][msg_t[w1]]["name"] = msg_t[w1];
    }
    for (var w2 in db["word"]) {
      if (comp(msg_t[w1], db["word"][w2]["name"]) < config.matchn) {
        //console.log(msg_t[w1], db["word"][w2]["name"]);
        words.push(db["word"][w2]["name"]);
      }
    }
    for (var w2 in words) {
      if (!db["channel"][channel]) {
        db["channel"][channel] = {};
        db["channel"][channel]["count"] = 0;
        db["channel"][channel]["name"] = channel;
      }
      if (!db["word"][words[w2]]["channel"][channel]) {
        db["word"][words[w2]]["channel"][channel] = {};
        db["word"][words[w2]]["channel"][channel]["count"] = 0;
        db["word"][words[w2]]["channel"][channel]["name"] = channel;
      }
      db["channel"][channel]["count"] += 1;
      db["word"][words[w2]]["channel"][channel]["count"] += 1;
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

function msg_channel(channel, msg, debug = true) {
  var msg_c = 0;
  var chs = JSON.parse('{}');
  for (w in msg) {
    ++msg_c;
    var ch_c = 0;
    var ch_s = 0
    var ch = [];
    var nch_s = 0
    if (!db["word"][msg[w]] || !db["word"][msg[w]]["channel"][channel]) {
      destruct(channel, [msg[w]]);
    };
    nc1 = db["word"][msg[w]]["channel"][channel]["count"] / db["channel"][channel]["count"];
    for (c in db["channel"]) {
      ++ch_c;
      if (!db["word"][msg[w]]["channel"][c]) {
        db["word"][msg[w]]["channel"][c] = {};
        db["word"][msg[w]]["channel"][c]["count"] = 0;
        db["word"][msg[w]]["channel"][c]["name"] = c;
      }
      nc2 = db["word"][msg[w]]["channel"][c]["count"] / db["channel"][c]["count"];
      ch_s += db["channel"][c]["count"];
      if (nc2 > nc1) {
        ch.push(db["channel"][c]["name"]);
      }
    }

    nch_s /= ch_c;
    ch_s /= ch_c;

    for (c in ch) {
      var ch_t = db["channel"][ch[c]]["count"];
      if (!(ch_s * (1 - 5 / 100) < ch_t && ch_t < ch_s * (1 + 5 / 100))) {
        ch.slice(c, 1);
        msg_c -= db["word"][msg[w]]["channel"][ch[c]]["count"];
      }
    }


    for (c in ch) {
      var nch_t = db["word"][msg[w]]["channel"][ch[c]]["count"] / db["channel"][ch[c]]["count"];
      if (ch[c] != channel && !(nch_s * (1 - 5 / 100) < nch_t && nch_t < nch_s * (1 + 5 / 100))) {
        if (!chs[ch[c]]) {
          chs[ch[c]] = {};
          chs[ch[c]]["name"] = ch[c];
          chs[ch[c]]["count"] = 0;

        }
        ++chs[ch[c]]["count"];
      } else {
        msg_c -= db["word"][msg[w]]["channel"][ch[c]]["count"];
      }
    }
  }

  var ch_cm = 0;
  var ch_m;
  for (c in chs) {
    if (chs[c]["count"] > ch_cm) {
      ch_cm = chs[c]["count"]
      ch_m = chs[c]["name"]
    }
  }

  if (msg_c * (20 / 100) < ch_cm) {
    if (debug) {
      console.log("DETECT: " + db["channel"][ch_m]["name"] + " in " + channel);
    }
    return db["channel"][ch_m]["name"];
  }
  return channel;
}
