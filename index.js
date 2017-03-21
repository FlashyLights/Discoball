var Discord = require("discord.js");
var botClass = require("./bot.js");
var mysqlClass = require("mysql");
var fs = require("fs");

var botconfig = JSON.parse(fs.readFileSync("./conf/bot.json"));

var mysql = mysqlClass.createPool(botconfig.mysql);

mysql.getConnection(function(err, connection) {

	if (err) {
		console.error("error connecting: " + err.stack);
		return;
	}

	console.log("created mysql connection pool");

	connection.release();
});

var dclient = new Discord.Client({
	fetchAllMembers: true,
});

dclient.on("ready", function() {
	try {
		console.log("Logged in");
		bot.init();
	} catch (e) {
		console.log(e);
	}
});

dclient.on("voiceStateUpdate", function(before, after) {
	if (before.voiceChannelID != after.voiceChannelID) {
		var channel;
		if (before.voiceChannelID != null) {
			// Joined from nowhere	
			channel = before.guild.channels.find(function(c){if(c.id == before.voiceChannelID) {return true;} return false;});
			if (channel == null) {
				return;
			}
			dclient.emit("voiceChannelLeave", channel, before.user);
		}
		if (after.voiceChannelID != null) {
			channel = before.guild.channels.find(function(c){if(c.id == after.voiceChannelID) {return true;} return false;});
			if (channel == null) {
				return;
			}
			dclient.emit("voiceChannelJoin", channel, after.user);
		}
	}
});


dclient.on("message", function(msg)  {
	try {
		if (msg.author.id == dclient.user.id) {
			// Ignore messages from myself
			return;
		}
		msg.orderedMentions = function(){
			var matches;
			var users = [];
			for (var x in this.parts) {
				matches = /<@(!?\d+)>/.exec(this.parts[x]);
				if (matches) {
					// This is a user
					var user = msg.guild.members.get(matches[1].replace("!", ""));
					if (user) {
						users.push(user);
					}
				}
			}
			return users;
		};
		msg.destructReply = function(to_send, timeout) {
			if (!timeout || timeout == 0) {
				timeout = 10;
			}
			return msg.reply(to_send+" This message will self-destruct in "+timeout+" seconds").then(function(sent_msg){
				msg.delete({timeout: timeout*1000 });
				sent_msg.delete({timeout: timeout*1000});
			});
		};
		if (msg.channel.constructor.name == "DMChannel") {
			var guild = bot.dclient.guilds.get(bot.config.defaultguildid);
			msg.channel.guild = guild;
		} else if (msg.channel.constructor.name == "GroupDMChannel") {
			return;
		}
		var self = bot;
		dclient.emit("rawMessage", msg);
		msg.parts = msg.content.split(" ");
		msg.parts[0] = msg.parts[0].toLowerCase();
		self.commands.handleCommand(msg);

	} catch(e) {
		console.log(e);
		bot.logMessage(msg.guild, "Caught error: "+e.message);
	}
});

dclient.login(botconfig.token);

var bot = new botClass(dclient, mysql, botconfig);
