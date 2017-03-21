var _ = require("lodash");
var DirLoad = require("dir-load");
var path = require("path");

class moduleManager {
	constructor(bot) {
		var self = this;
		self.bot = bot;
		self.loadedModules = {};
	}

	init() {
		var self = this;
		self.initModules();
	}

	locateModules() {
		var self = this;
		var entryPoints = [];

		var manifests = new DirLoad(__dirname + "/modules", {
			includedExtensions: [".json"],
			filter: function(item) {
				if (path.basename(item.path) === "module.json") {
					return true;
				}
				return false;
			},
		});

		var loadedManifests = manifests.requireAllEx();

		loadedManifests = _.map(loadedManifests, function(manifest) {
			manifest.module.base = path.dirname(manifest.relative);
			return manifest;
		});

		loadedManifests = _.filter(loadedManifests, function(o) {
			if (!o.module.name) {
				return false;
			}
			return !_.includes(self.bot.config.ignoreModules, o.module.base)
		});

		return loadedManifests;

	}


	initModules() {
		var self = this;
		if (this.initedModules) {
			return;
		}
		this.initedModules = 1;

		var appModules = self.locateModules();

		_.each(appModules, function(app) {
			var module = app.module
			if (!module.entryPoints || !module.author) {
				return;
			}
			console.log("Loading " + module.name + " by " + module.author.name);
			
			var loadedEntryPoints = {};
			_.each(module.entryPoints, function(entryPoint) {
				var friendly = _.camelCase(entryPoint.replace(/\.(.*?)$/, "").replace(/\//g, " "));

				if (_.includes(self.bot.config.ignoreModules, path.join(module.base, entryPoint))) {
					return;
				}

				try {
					var loadedClass = require(path.resolve("modules", module.base, entryPoint));
				} catch (e) {
					if (e.code !== 'MODULE_NOT_FOUND') {
						throw e;
					}
					console.error("Entrypoint " + entryPoint + " was not found. This is likely due to a malformed module.json");
				}

				loadedEntryPoints[friendly] = new loadedClass(self.bot);
				loadedEntryPoints[friendly].init();
			});

			module.classes = loadedEntryPoints;

			module.getClass = function(className) {
				if (!_.has(module.classes, className)) {
					self._moduleClassNotFound(className, module.base);
				}
				return module.classes[className];
			}

			self.loadedModules[module.base] = module;
		});

		var moduleList = _.map(self.loadedModules, function(o) {
			return o.name + " by " + o.author.name;
		});

		moduleList = moduleList.join(", ");

		self.bot.dclient.guilds.forEach(function(guild) {
			self.bot.logMessage(guild, "Loaded modules: " + moduleList);
		});

		_.each(self.loadedModules, function(module) {
			_.each(module.classes, function(loadedClass) {
				if (_.isFunction(loadedClass.postInit)) {
					loadedClass.postInit();
				}
			});
		});

	}

	isLoaded(moduleName) {
		var self = this;
		if (_.has(self.loadedModules, moduleName)) {
			return true;
		}
		return false;
	}

	getModule(moduleName) {
		var self = this;
		if (!self.isLoaded(moduleName)) {
			self._moduleNotFound(moduleName);
		}
		return self.loadedModules[moduleName];
	}

	_moduleNotFound(moduleName) {
		var self = this;
		var caller = self._getCallerFile();
			if (caller) {
			throw new Error(`${caller} tried to access the ${moduleName} module, which can't be found.
You either have this dependency disabled, or not installed at all.`);
		}
		throw new Error(`Something tried to access the ${moduleName} module, which can't be found.
Unfortunately we were prevented from determining which module caused this.
You either have this dependency disabled, or not installed at all.`);
	}

	_moduleClassNotFound(className, moduleName) {
		var self = this;
		var caller = self._getCallerFile();
		if (caller) {
			throw new Error(`${caller} tried to access the ${className} class of ${moduleName}, which can't be found.
One of these modules may require updating.`);
		}
		throw new Error(`Something tried to access the ${className} class of ${moduleName}, which can't be found.
Unfortunately we were prevented from determining which module caused this.
One of these modules may require updating.`);
	}

	_getCallerFile() {
		var originalFunc = Error.prepareStackTrace;

		var callerfile;
		try {
			var err = new Error();
			var currentfile;

			Error.prepareStackTrace = function (err, stack) {
				return stack;
			}

			currentfile = err.stack.shift().getFileName();

			while (err.stack.length) {
				callerfile = err.stack.shift().getFileName();

				if(currentfile !== callerfile) {
					break;
				}
			}
		} catch (err) {
			throw err;
		}

		Error.prepareStackTrace = originalFunc;
		return callerfile;
	}
}

module.exports = moduleManager;
