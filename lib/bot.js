var Promise = require("bluebird");
var _ = require("lodash");
var commandController = require("./commandController");
var moduleManager = require("./moduleManager");
var DirLoad = require("dir-load");
var path = require("path");

class Bot {
	constructor(discoball) {
		var self = this;
		self.discoball = discoball;
		self.bot = self; // Just because sometimes, self.bot.bot.bot.bot.bot.bot should be resolvable.
		self.mysql = discoball.mysql;
		self.dclient = discoball.dclient;
		self.config = discoball.config;
		self.cooldowns = {};
	    self.logging = self.discoball.logger("discoball::bot");
		self.basedir = path.resolve(__dirname);
	}

	init() {
		this.initCC();
		this.initModuleManager();
	}

	initCC() {		
		if (this.initedCC) {
			return;
		}
		this.initedCC = 1;
		this.commands = new commandController(this);
		this.commands.init();
	}

	initModuleManager() {
		if (this.initedModuleManager) {
			return;
		}
		this.initedModuleManager = 1;
		this.modules = new moduleManager(this);
		this.modules.init();
	}

	listModules(state = "all") {
		var self = this;

		var appModules = modules.requireAllEx();
		var filterModules;
		ignoreModules = self.config.get('discoball.ignoreModules');
		if (state == "all") {
			filterModules = function(k) {
				return true;
			}
		} else if (state == "enabled") {
			filterModules = function(k) {
				for (var x in ignoreModules) {
					var ignoreModule = ignoreModules[x];
					if (k.indexOf(ignoreModule) >= 0) {
						return false;
					}
				}
				return true;
			};
		} else if (state == "disabled") {
			filterModules = function(k) {
				for (var x in ignoreModules) {
					var ignoreModule = ignoreModules[x];
					if (k.indexOf(ignoreModule) >= 0) {
						return true;
					}
				}
				return false;
			};
		}
		var modulesList = Object.keys(appModules).filter(filterModules);
		for (var x in modulesList) {
			modulesList[x] = modulesList[x].replace("/", ".");
		}
		return modulesList;
	}

	makeRandomID(len) {
		var text = "";
		var possible = "abcdefghjkmnpqrstuvwxyz23456789";

		for( var i=0; i < len; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

	makeNumericID(len) {
		var text = "";
		var possible = "1234567890";

		for( var i=0; i < len; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

	logMessage(server, message) {
		var self = this;
		var logchannel = self.config.get("discoball.logchannel");
		var channel = server.channels.find(function(chan) {
			return chan.name == logchannel;
		});
		if (!channel) {
			console.log("Could not find log channel "+logchannel+" on "+server.name+".");
			console.log(message)
			return new Promise(function(resolve) {
				resolve();
			});
		}
		return channel.send(message);
	}

	addCooldown(name, time) {
		var self = this;
		if (!time) {
			time = 30;
		}
		self.cooldowns[name] = 1;
		setTimeout(function(){
			console.log("Removing cooldown for",name);
			self.cooldowns[name] = 0;
		}, time * 1000);
	}

	checkCooldown(name, yes, no) {
		var self = this;
		if (no == null) {
			no = function(){};
		}
		if (self.cooldowns[name] != 1) {
			return yes();
		}
		return no();
	}
	sanitiseDbInput(input) {
		if (typeof input != "string") {
			return input;
		}
		return input.replace(/[^\w|:-\s]/gi, "");
	}

}

module.exports = Bot;
