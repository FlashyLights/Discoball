class commandPermissions {
	constructor(bot) {
		var self = this;
		self.bot = bot;
		self.adminchannels = self.bot.config.adminchannels;
	}

	isAdmin(msg, failedCallback) {
		var self = this;
		var channel, adminchan;
		for (var x in self.bot.commands.perms.adminchannels) {
			adminchan = self.bot.commands.perms.adminchannels[x];
			channel = msg.guild.channels.find("name", adminchan);
			if (channel && channel.members.has(msg.member.id)) {
				return true;
			}
		}

		if (failedCallback) {
			failedCallback(msg);
		}

		return false;
	}

	isInRoom(msg, rooms, failedCallback) {
		for (var x in rooms) {
			var room = rooms[x];
			if (msg.channel.name == room) {
				return true;
			}
		};

		if (failedCallback) {
			failedCallback(msg);
		}
		return false;
	}

	isInAdminRoom(msg, failedCallback) {
		var self = this;
		var adminchan;
		for (var x in self.bot.commands.perms.adminchannels) {
			adminchan = self.bot.commands.perms.adminchannels[x];
			if (msg.channel.name == adminchan) {
				return true;
			}
		}

		if (failedCallback) {
			failedCallback(msg);
		}
		return false;
	}

	pass() {
		return true;
	}
}
module.exports = commandPermissions;

