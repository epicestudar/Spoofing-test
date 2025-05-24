const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

const PIN_TABLE = process.env.PIN_TABLE;
const LOG_TABLE = process.env.LOG_TABLE;

exports.putPin = (email, pin, expiresAt) => {
  return dynamo.put({
    TableName: PIN_TABLE,
    Item: { email, pin, expiresAt },
  }).promise();
};

exports.getPin = (email) => {
  return dynamo.get({
    TableName: PIN_TABLE,
    Key: { email },
  }).promise().then(res => res.Item);
};

exports.logEmail = (logItem) => {
  return dynamo.put({
    TableName: LOG_TABLE,
    Item: logItem,
  }).promise();
};
