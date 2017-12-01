const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json')
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
                if(err) {
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
                if(err) {
                        return console.log(err);
                }
        });
});



client.login(token);
