'use strict';
const fs = require('fs');
const path = require('path');

let Config = function () {
  this.filename = "box.config.json";
  this.readFile = path.join(__dirname, '../', this.filename);
  this.alternateFilename;
  this.config;

  Config.prototype.getConfig = function (alternateFilename) {
    if (alternateFilename) {
      this.alternateFilename = alternateFilename;
      this.readFile = path.join(__dirname, '../', this.alternateFilename);
    }
    
    if(this.config && !this.alternateFilename) {
      return this.config;
    }
    
    let config;
    try {
      config = fs.readFileSync(this.readFile, 'utf-8');
    } catch (e) {
      console.error("There was an error reading config file.");
      console.error(e);
    }

    if (!config) {
      throw new Error("No configuration file found.");
    }

    try {
      config = JSON.parse(config);
    } catch (e) {
      throw new Error("Configuration file unreadable.");
    }

    this.config = config;
    return this.config;
  };
};

module.exports = new Config();