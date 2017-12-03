const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json')
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const client = new Discord.Client();

const token = config.token;

const db = JSON.parse(fs.readFileSync(config.webroot + "/db.json"));


var adminProfile = JSON.parse(fs.readFileSync(config.webroot + "/adminProfile.json"));
var buff = JSON.parse('{}');
var time_count = JSON.parse('{}');
var msg_bot = [];

var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
var TOKEN_DIR = config.token_dir;
var TOKEN_PATH = TOKEN_DIR + "/token.json";

fs.readFile('client_secret.json', (err, content) => {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  setInterval(() => {
    authorize(JSON.parse(content), {
      'params': {
        'id': 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        'part': 'snippet,contentDetails,statistics'
      }
    }, channelsListById);
  }, config.youtube_time);
});

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

client.on('messageReactionAdd',
  (messageReaction, user) => {
    var channel_name = messageReaction.message.channel.name
    if (messageReaction.message.author.username == config.bot_name && messageReaction.emoji.name == config.emoji_correct) {
      var corrected = false
      while (msg_channel(channel_name, [buff[channel_name][w]], false) != channel_name) {
        for (w in buff[channel_name]) {
          ++db["word"][buff[channel_name][w]]["channel"][channel_name]["count"];
          ++db["channel"][channel_name]["count"];
        }
        corrected = true;
      }
      console.log(channel_name + " corrected:", corrected);
      messageReaction.message.delete();
    }
  });

client.on('message',
  (message) => {
    var msg = message.content.split(" ");
    var channel_name = message.channel.name;
    if (!time_count[channel_name]) {
      time_count[channel_name] = {};
      time_count[channel_name]["count"] = config.messages_interval;
      time_count[channel_name]["sendable"] = true;
    }
    if (!buff[channel_name]) {
      buff[channel_name] = [];
    }
    for (w in msg) {
      buff[channel_name][msg[w]] = msg[w];

    }
    while (buff[channel_name].lenght > config.buffer_size) {
      delete buff[channel_name][0];
    }
    if (!message.author.bot) {
      console.log(channel_name, ":", message.content);
      destruct(channel_name, message.content.split(" "));
      if (!time_count[channel_name]["sendable"]) {
        --time_count[channel_name]["count"];
      }
      if (time_count[channel_name]["count"] == 0) {
        time_count[channel_name]["count"] = config.messages_interval;
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
  });

client.login(token);

function destruct(channel, msg) {
  var msg_t = msg;
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

function comp(w1, w2) {
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

function msg_channel(channel, msg, debug) {
  var msg_c = 0;
  var chs = JSON.parse('{}');
  var ch_simw = [];
  for (w in msg) {
    ++msg_c;
    var ch = [];
    if (!db["word"][msg[w]] || !db["word"][msg[w]]["channel"][channel]) {
      destruct(channel, [msg[w]]);
    };
    var nc1 = db["word"][msg[w]]["channel"][channel]["count"] / db["channel"][channel]["count"];

    for (c in db["channel"]) {
      if (!db["word"][msg[w]]["channel"][c]) {
        db["word"][msg[w]]["channel"][c] = {};
        db["word"][msg[w]]["channel"][c]["count"] = 0;
        db["word"][msg[w]]["channel"][c]["name"] = c;
      }
      nc2 = db["word"][msg[w]]["channel"][c]["count"] / db["channel"][c]["count"];
      if (nc2 > nc1) {
        ch.push(db["channel"][c]["name"]);
        // ch_simw.push(0);
      }
    }

    // for (w_c in db["word"]) {
    //   for (c in ch) {
    //     if (db["word"][w_c]["channel"][ch[c]] && comp(db["word"][w_c]["name"],msg[w])) {
    //       ++ch_simw[c];
    //     }
    //   }
    // }

    for (c in ch) {
      // var nch_t = ch_simw[c] * db["word"][msg[w]]["channel"][ch[c]]["count"] / db["channel"][ch[c]]["count"];
      if (db["channel"][ch[c]]["count"] > config.channel_words_min) {
        var nch_t = db["word"][msg[w]]["channel"][ch[c]]["count"] / db["channel"][ch[c]]["count"];
        if (nch_t >= nc1 * (1 + config.error_percents / 100)) {
          if (!chs[ch[c]]) {
            chs[ch[c]] = {};
            chs[ch[c]]["name"] = ch[c];
            chs[ch[c]]["count"] = 0;

          }
          ++chs[ch[c]]["count"];
        } else {
          ch.slice(c, 1);
        }
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

  if (msg_c * (config.words_differents_percents / 100) < ch_cm) {
    if (debug) {
      console.log("DETECT: " + db["channel"][ch_m]["name"] + " in " + channel);
    }
    return db["channel"][ch_m]["name"];
  }
  return channel;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, requestData, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, requestData, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, requestData);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, requestData, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, requestData);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Remove parameters that do not have values.
 *
 * @param {Object} params A list of key-value pairs representing request
 *                        parameters and their values.
 * @return {Object} The params object minus parameters with no values set.
 */
function removeEmptyParameters(params) {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
}

/**
 * Create a JSON object, representing an API resource, from a list of
 * properties and their values.
 *
 * @param {Object} properties A list of key-value pairs representing resource
 *                            properties and their values.
 * @return {Object} A JSON object. The function nests properties based on
 *                  periods (.) in property names.
 */
function createResource(properties) {
  var resource = {};
  var normalizedProps = properties;
  for (var p in properties) {
    var value = properties[p];
    if (p && p.substr(-2, 2) == '[]') {
      var adjustedName = p.replace('[]', '');
      if (value) {
        normalizedProps[adjustedName] = value.split(',');
      }
      delete normalizedProps[p];
    }
  }
  for (var p in normalizedProps) {
    // Leave properties that don't have values out of inserted resource.
    if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
      var propArray = p.split('.');
      var ref = resource;
      for (var pa = 0; pa < propArray.length; pa++) {
        var key = propArray[pa];
        if (pa == propArray.length - 1) {
          ref[key] = normalizedProps[p];
        } else {
          ref = ref[key] = ref[key] || {};
        }
      }
    };
  }
  return resource;
}


function channelsListById(auth, requestData) {
  var service = google.youtube('v3');
  var parameters = removeEmptyParameters(requestData['params']);
  parameters['auth'] = auth;
  service.subscriptions.list(parameters, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    console.log(response);
  });
}
