'use strict';
//Third-Pary Libraries
const request = require('request');
const _ = require('underscore');

//Internal Utilities
const constructOptions = require('./util/construct-options');
const constructQueryParams = require('./util/construct-query-params');
const longPollMessageValues = require('./constants/long-poll-message-values');
const config = require('./util/get-config').getConfig();
const errorMessage = function (response) {
  return `Status Code: ${response.statusCode}
        Status Message: ${response.statusMessage}`;
}

//The Object used outside of this module to interact with the private functions below.
//TODO: Create general Box Client and allow LongPoller to inherit from this Client. 
let LongPoller = function () { };

//Capture current Stream Position 
let _currentStreamPosition;
//Capture URL for Long Polling
let _longPollUrl;
//Capture message returned by Long Polling
//Values: "new_change", "reconnect" -- enum for values in long-poll-message-values.js
let _messageValue;

/**
 * Sets the current Stream Position for the first time
 * @return 
 * @resolves {Promise<null>} returns a Promise that sets the _currentStreamPosition or, if not running for the first time, returns a Promise that resolves to null. 
 */
function _checkStreamPosition() {
  return new Promise((resolve, reject) => {
    if (_currentStreamPosition === undefined) { 
      //Retrieve the current Stream Position using stream_position=now
      _getStreamPosition()
        .then((streamPosition) => {
          console.log("Setting current stream position for the first time...");
          //Set the current Stream Position variable
          _currentStreamPosition = streamPosition;
          resolve();
        });
    } else {
      resolve();
    }
  });
};

/**
 * Retrieves the current Stream Position
 * @return 
 * @resolves {Promise<String>} returns the next_stream_position value from the JSON object returned by Box.
 * @rejects {Promise<Error>} throws an Error if the request encounters an error, or if the Response object is not 200. 
 */
function _getStreamPosition() {
  const url = "https://api.box.com/2.0/events?stream_position=now";
  const options = constructOptions({ url });

  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) { reject(err) };
      if (response.statusCode === 200) {
        resolve(JSON.parse(response.body).next_stream_position);
      } else {
        //TODO: Create Error class for Box Errors.
        reject(new Error(`There was an error retrieving the current stream position:
        ${errorMessage(response) }`));
      }
    });
  });
};

/**
 * Retrieves the URL to use for Long Polling
 * @return 
 * @resolves {Promise<String>} returns the URL value inside the first index of entries from the JSON object returned by Box.
 * @rejects {Promise<Error>} throws an Error if the request encounters an error, or if the Response object is not 200. 
 */
function _getLongPollUrl() {
  const method = "OPTIONS";
  const options = constructOptions({ method })
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) { reject(err) };
      if (response.statusCode === 200) {
        resolve(_.first(JSON.parse(response.body).entries).url);
      } else {
        //TODO: Create Error class for Box Errors.
        reject(new Error(`There was an error retrieving the long poll URL.
        ${errorMessage(response) }`));
      }
    });
  });
};

/**
 * Retrieves the URL to use for Long Polling
 * @param {String} url - takes the url returned by getLongPollUrl to begin listening to the Box Long Polling service.
 * @return 
 * @resolves {Promise<String>} - returns the message value from the JSON object returned by Box.
 * A message is sent when an event occurs within the Box account or when a new Long Polling URL is required. 
 * These message values include "new_change" and "reconnect".
 * @rejects {Promise<Error>} - throws an Error if the request encounters an error, or if the Response object is not 200. 
 */
function _startLongPolling(url) {
  const isAuthorizedRequest = false;
  const options = constructOptions({ isAuthorizedRequest, url })
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) { reject(err) };
      if (response.statusCode === 200) {
        resolve(JSON.parse(response.body));
      } else {
        //TODO: Create Error class for Box Errors
        reject(new Error(`There was an error starting the long poll process.
        ${errorMessage(response) }`));
      }
    });
  });
};

/**
 * Retrieves the event information 
 * @param {Object} queryParams - used within constructQueryParams, this object is expected to have a key "stream_position" and value of the current Stream Position.
 * @return 
 * @resolves {Promise<Object>} - returns the first entry within the Box event. Both event_type and event_id are important values within this Object.
 * @rejects {Promise<Error>} - throws an Error if the request encounters an error, or if the Response object is not 200. 
 */
function _getEvent(queryParams) {
  let url = config.baseUrl;
  let urlWithParams = constructQueryParams(url, queryParams);
  const options = constructOptions({ url: urlWithParams });
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) { reject(err) };
      if (response.statusCode === 200) {
        resolve(JSON.parse(response.body));
      } else {
        //TODO: Create Error class for Box Errors
        reject(new Error(`There was an error retrieving the event.
        ${errorMessage(response) }`));
      }
    });
  });
};

/**
 * Used as the initialization method for this module when exporting. 
 * Run will call itself recursively to begin the Long Polling process again automatically.
 */
LongPoller.prototype.run = function () {
  let self = this;

  _checkStreamPosition()
    .then(() => {
      console.log(`Current Stream Position: ${_currentStreamPosition}`);
      //Retrieve the Long Polling URL
      return _getLongPollUrl();
    })
    .then((url) => {
      //Set the Long Polling URL
      _longPollUrl = url;
      console.log(`realtime url: ${_longPollUrl}`);
      console.log('long polling...');
      //Begin the Long Polling process
      return _startLongPolling(_longPollUrl);
    })
    .then((message) => {
      //Set the message value that eventually gets returned by the Long Polling service
      _messageValue = message.message;
      console.log(_messageValue);
      //Check if the message value is "new_change"
      if (_messageValue === longPollMessageValues.new_change) {
        //If "new_change" message sent, fetch the event data that fired the event
        console.log('fetching events...');
        //Retrieves the event data -- { stream_position: _currentStreamPosition } is used to add query parameters on the getEvent URL resource
        return _getEvent({ stream_position: _currentStreamPosition })
          .then((event) => {
            //Logging if event returns as undefined
            if (event === undefined) {
              console.log("event data unavailable...");
              //Set the _currentStreamPosition to undefined in edge case for unavailable event data
              //This fires the logic in _checkStreamPosition to use stream_position=now to retrieve the current stream position
              _currentStreamPosition = undefined;
            }
            //Safety check in case event comes back undefined
            if (event) {
              //Set the _currentStreamPosition to use the next_stream_position from the event data
              //Avoids missing events while long polling
              _currentStreamPosition = event.next_stream_position;
              //Safety check to verify the event has entries
              if (event.entries && event.entries.length > 0) {
                //Handle one or more entries in the entries array
                event.entries.forEach((entry) => {
                  console.log(`${entry.event_id} | ${entry.event_type}`);
                });
              }
            }
            //Recursively call this function to restart Long Polling
            self.run();
          });
      } else if (_messageValue === longPollMessageValues.reconnect) {
        //If "reconnect" is sent, recursively call this function to restart Long Polling
        self.run();
      } else {
        //To handle edge and unknown cases, just restart Long Polling
        console.log("Unknown message. Restarting Long Polling...");
        self.run();
      }
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = new LongPoller();