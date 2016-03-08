'use strict';
const config = require('./get-config').getConfig();
const defaultHeaderConfigurationValues = { isAuthorizedRequest: true, method: 'GET', url: config.baseUrl };
const _ = require('underscore');

module.exports = function constructHeaders(headerConfiguration) {
  headerConfiguration = headerConfiguration || {};
  let missingValues = _.difference(Object.keys(defaultHeaderConfigurationValues), Object.keys(headerConfiguration));
  if (missingValues.length > 0) {
    missingValues.forEach((value) => {
      headerConfiguration[value] = defaultHeaderConfigurationValues[value];
    });
  }
  
  let options = {};
  if (headerConfiguration.isAuthorizedRequest) {
    const bearerToken = config.Bearer;
    options = {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      },
      url: headerConfiguration.url,
      method: headerConfiguration.method
    };
  } else {
    options = {
      url: headerConfiguration.url,
      method: headerConfiguration.method
    };
  }
  return options;
};