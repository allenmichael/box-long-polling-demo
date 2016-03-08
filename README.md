# Box Long Polling Demo
## Introduction
This project is a demostration of using Node.js to handle the long polling process to receive notifications about Box events. For more information about the long polling process in Box, [see this documentation](https://box-content.readme.io/docs/using-long-polling-to-monitor-events). 
## Installation Instructions
### Prerequisites 
- Node.js 4.\*.\* or greater
- NPM 2.\*.\* or greater

From the root directory of the project run the following command:

`npm install`

## Usage
Use the configuration file `box.config.json` to store your generated developer token. You can generate these tokens within your Box application. Each token is valid for 60 minutes. 

The `box.config.json` file expects the following values:
```json
{
  "Bearer": "replace_with_your_developer_token",
  "baseUrl": "https://api.box.com/2.0/events"
}
```
You shouldn't need to alter the `baseUrl` value. Your developer token should replace the value for the `Bearer` key. 

Use the following command to run tests:

`npm test`

Use the following command to start long polling for Box events:

`npm start`

Once the process starts running, you can perform actions in your Box account to fire events. For example, previewing a file should generate an `ITEM_PREVIEW` event. 

Long polling will continue automatically by default. To end your long polling session, you can manually terminate the process (**CTRL + C**, for example).