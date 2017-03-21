// var Promise = require("bluebird");
var _ = require("lodash");
var commandController = require("./commandController.js");
var moduleManager = require("./moduleManager.js");
var DirLoad = require("dir-load");
var path = require("path");

var modules = new DirLoad(__dirname + "/modules");

class Bot {
	constructor(dclient, mysql, config) {
		var self = this;
		self.bot = self; // Just because sometimes, self.bot.bot.bot.bot.bot.bot should be resolvable.
		self.mysql = mysql;
		self.dclient = dclient;
		self.cooldowns = {};
		self.basedir = path.resolve(__dirname);
		self.mergeConfig(config);
		self.presenceGameCache = {};
		self.presenceUserCache = {};
		setInterval(function() {
			self.presenceGameCache = {};
			self.presenceUserCache = {};
		}, 30*60*100); // Clear the presence caches every 30 minutes
	}

	init() {
		this.initCC();
		this.initModuleManager();
	}

	mergeConfig(config) {
		var self = this;
		if (!self.config) {
			self.config = {
				ignoreModules: [],
				logchannel: "bot-log",
				adminchannels: ["admin-chat"],
			};
		}
		for (var x in config) {
			self.config[x] = config[x];
		}
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
		if (state == "all") {
			filterModules = function(k) {
				return true;
			}
		} else if (state == "enabled") {
			filterModules = function(k) {
				for (var x in self.config.ignoreModules) {
					var ignoreModule = self.config.ignoreModules[x];
					if (k.indexOf(ignoreModule) >= 0) {
						return false;
					}
				}
				return true;
			};
		} else if (state == "disabled") {
			filterModules = function(k) {
				for (var x in self.config.ignoreModules) {
					var ignoreModule = self.config.ignoreModules[x];
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
		var channel = server.channels.find("name", self.config.logchannel);
		if (!channel) {
			console.log("Could not find log channel "+self.config.logchannel+" on "+server.name+".", message);
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
