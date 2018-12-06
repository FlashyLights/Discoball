/*
 * Copyright (c) Flashy Lights Ltd 2018 - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict';

var configLib = require('config');
var path = require('path');

configLib.mergeConfigs = function() {
  var self = this;
  configLib.util.setModuleDefaults('discoball', self.defaultConfig());

};

configLib.defaultConfig = function() {
  var defaults = {
    /*
    Warning: Default baseDir is extremely unreliable, and should only be used as a last resort.
    Always override this in the application config.
     */
    baseDir: path.dirname(require.main.filename),
    discoballDir: path.resolve(__dirname),
    ignoreModules: [
        "classes/"
    ],
    adminchannels: [
      "admin-chat",
      "bot-log",
      "management"
    ],
    
    logchannel: "bot-log",
    defaultguildid: undefined,
    secretKey: undefined,
    debug: false,
  };

  return defaults;
};

module.exports = configLib;
