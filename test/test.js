'use strict';
const assert = require('assert');
const _ = require('underscore');

const Config = require('.././util/get-config');
const constructOptions = require('.././util/construct-options');
const constructQueryParams = require('.././util/construct-query-params');


describe('getConfig', function () {
  it('should return a Config Object with a getConfig function', function () {
    let func = "getConfig";
    _.contains(Object.keys(Config), func);
  });

  it('should return a Bearer value and baseUrl value when getConfig is called', function () {
    let keys = ["Bearer", "baseUrl"]
    Object.keys(Config.getConfig()).forEach((key) => {
      assert.ok(_.contains(keys, key));
    });
  });

  it('should allow an alternate filename to be provided', function () {
    let testFile = "test.box.config.json";
    let testVal = "test";
    let testUrl = "https://api.box.com/2.0/events";
    let config = Config.getConfig(testFile);
    assert.equal(config.Bearer, testVal);
    assert.equal(config.baseUrl, testUrl);
  });
});

describe('constructOptions', function () {
  let config = Config.getConfig();
  let defaultMethod = "GET";
  it('should provide default request options', function () {
    let options = constructOptions();
    assert.equal(options.headers.Authorization, `Bearer ${config.Bearer}`);
    assert.equal(options.method, defaultMethod);
    assert.equal(options.url, config.baseUrl);
  });

  it('should turn authorization off', function () {
    let isAuthorizedRequest = false;
    let options = constructOptions({ isAuthorizedRequest });
    assert.ok(options.headers === undefined);
    assert.equal(options.method, defaultMethod);
    assert.equal(options.url, config.baseUrl);
  });

  it('should change request method', function () {
    let method = "OPTIONS";
    let options = constructOptions({ method });
    assert.equal(options.headers.Authorization, `Bearer ${config.Bearer}`);
    assert.equal(options.method, method);
    assert.equal(options.url, config.baseUrl);
  });

  it('should change request url', function () {
    let url = "https://box.com";
    let options = constructOptions({ url });
    assert.equal(options.headers.Authorization, `Bearer ${config.Bearer}`);
    assert.equal(options.method, defaultMethod);
    assert.equal(options.url, url);
  });
});

describe('constructQueryParams', function () {
  it('should add query params to a URL', function() {
    let url = "https://box.com/";
    let finalUrl = "https://box.com/?stream_position=12345&userId=54321&favoriteFood=sushi";
    let queryParams = {stream_position: "12345", userId: "54321", favoriteFood: "sushi"};
    let urlWithQueryParams = constructQueryParams(url, queryParams);
    assert.equal(urlWithQueryParams, finalUrl);
  });
});