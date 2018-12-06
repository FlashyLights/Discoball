/*
 * Copyright (c) Flashy Lights Ltd 2018 - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

var winston = require('winston');
var split = require('split');
var loggingLevel = 'silly';
var env = process.env.NODE_ENV || 'development';
if (env === 'production') {
  loggingLevel = 'warn';
}

winston.configure({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console({
      level: loggingLevel,
    }),
    new winston.transports.File({
      level: 'info',
      filename: 'discoball.log',
    }),
  ],
});

// noinspection JSUnresolvedFunction
winston.stream = split().on('data', function(line) {
  winston.log('info', line);
});

module.exports = function(fileName) {
  return {
    error: function(msg) {
      winston.error(`${fileName}: ${msg}`);
    },
    warn: function(msg) {
      winston.warn(`${fileName}: ${msg}`);
    },
    info: function(msg) {
      winston.info(`${fileName}: ${msg}`);
    },
    verbose: function(msg) {
      winston.verbose(`${fileName}: ${msg}`);
    },
    debug: function(msg) {
      winston.debug(`${fileName}: ${msg}`);
    },
    silly: function(msg) {
      winston.silly(`${fileName}: ${msg}`);
    },
  };
};
