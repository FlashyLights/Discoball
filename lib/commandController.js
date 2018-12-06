var Discord = require("discord.js");
var commandPermissions = require("./commandPermissions.js");

class commandController {
	constructor(bot) {
		var self = this;
		self.bot = bot;
		self.logging = bot.discoball.logger("discoball::commandController");
		self.commandList = new Discord.Collection();
		self.perms = new commandPermissions(self.bot);
	}

	init() {
		var self = this;

		self.addCommand({
			trigger: "!commands",
			function: self.listCommandsCommand,
			permCheck: self.perms.isInAdminRoom,
		});
	}

	addCommand(command) {
		var self = this;

		if (typeof command.trigger == "string") {
			command.trigger = [command.trigger];
		}
		command.trigger.forEach(function (trigger) {
			if (self.commandList.has(trigger)) {
				self.logging.error("Failed to register command, command already exists: " + trigger);
				return;
			}
			command.bot = self.bot;
			command._function = command.function;
			if (command.thisarg) {
				command._function = command.function.bind(command.thisarg);
			}
			self.commandList.set(trigger, command);
			self.logging.info("Registered the " + trigger + " command");
		});
	}

	handleCommand(msg) {
		var self = this;

		var command = msg.parts[0];
		if (self.commandList.has(command)) {
			var commandObject = self.commandList.get(command);
			if (commandObject.permCheck(msg)) {
				commandObject._function(msg);
			}
		}
	}

	listCommandsCommand(msg) {
		var self = this;
		var commands = [];

		self.bot.commands.commandList.forEach(function(command, trigger) {
			commands.push(trigger);
		});

		msg.channel.send("Registered commands: \n" + commands.join(", ") + "\n\n");
	}
}
module.exports = commandController;
