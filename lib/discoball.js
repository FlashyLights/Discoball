var Discord = require("discord.js");
var botClass = require("./bot.js");
var mysqlClass = require("mysql");
var fs = require("fs");
var config = require('./config');
var logger = require('./logging');

class Discoball {
    constructor() {
        var self = this;
        self.logger = logger;
        self.logging = self.logger("discoball::base");
        self.config = config;
        self.config.mergeConfigs();
        self.mysql = mysqlClass.createPool(self.config.get('discoball.database'));
        self.mysql.getConnection(function(err, connection) {
            if (err) {
                console.error("error connecting: " + err.stack);
                return;
            }
            self.logging.debug("created mysql connection pool");
            connection.release();
        });
        self.init();
    }

    init() {
        var self = this;
        self.dclient = new Discord.Client({
            fetchAllMembers: true,
        });
        self.bot = new botClass(self);
        self.dclient.on("ready", function() {
            try {
                self.logging.debug("Logged in");
                self.bot.init();
            } catch (e) {
                self.logging.error(e);
            }
        });
        self.dclient.on("voiceStateUpdate", self.voiceStateUpdate.bind(self));
        self.dclient.on("message", self.message.bind(self));
        self.dclient.login(self.config.get('discoball.token'));


    }

    voiceStateUpdate(before, after) {
        var self = this;
        if (before.voiceChannelID != after.voiceChannelID) {
            var channel;
            if (before.voiceChannelID != null) {
                // Joined from nowhere    
                channel = before.guild.channels.find(function(c){if(c.id == before.voiceChannelID) {return true;} return false;});
                if (channel == null) {
                    return;
                }
                self.dclient.emit("voiceChannelLeave", channel, before.user);
            }
            if (after.voiceChannelID != null) {
                channel = before.guild.channels.find(function(c){if(c.id == after.voiceChannelID) {return true;} return false;});
                if (channel == null) {
                    return;
                }
                self.dclient.emit("voiceChannelJoin", channel, after.user);
            }
        }        
    }

    message(msg) {
        var self = this;
        try {
            if (msg.author.id == self.dclient.user.id) {
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
                var guild = self.bot.dclient.guilds.get(self.bot.config.defaultguildid);
                msg.channel.guild = guild;
                msg.member = msg.guild.members.get(msg.author.id);
            } else if (msg.channel.constructor.name == "GroupDMChannel") {
                return;
            }
            self.dclient.emit("rawMessage", msg);
            msg.parts = msg.content.split(" ");
            msg.parts[0] = msg.parts[0].toLowerCase();
            self.bot.commands.handleCommand(msg);

        } catch(e) {
            self.logging.error(e);
            self.bot.logMessage(msg.guild, "Caught error: "+e.message);
        }
    }
}



module.exports = Discoball;