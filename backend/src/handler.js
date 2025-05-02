const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const ses = new AWS.SES({ region: "us-east-1" });
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.sendAndLog = async (event) => {
  console.log("Lambda iniciado");
  try {
    const body = JSON.parse(event.body);
    console.log("Body recebido:", body);

    const { to, subject, message } = body;

    // Envio do e-mail
    const emailParams = {
      Source: process.env.SENDER_EMAIL, // ex: "no-reply@minhaempresa.com"
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: message },
        },
      },
    };

    console.log("Enviando email via SES...");

    const emailResponse = await ses.sendEmail(emailParams).promise();

    console.log("Email enviado com sucesso:", emailResponse);

    // Log no DynamoDB
    const logItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      to,
      subject,
      message,
      result: "success",
      messageId: emailResponse.MessageId,
    };

    console.log("Salvando log no DynamoDB...");

    await dynamo
      .put({
        TableName: process.env.LOG_TABLE,
        Item: logItem,
      })
      .promise();

      console.log("Log salvo com sucesso");

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, messageId: emailResponse.MessageId }),
    };
  } catch (error) {
    console.error("Erro:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};
