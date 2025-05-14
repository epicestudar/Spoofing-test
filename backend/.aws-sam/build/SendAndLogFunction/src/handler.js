const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

console.log("Variáveis de ambiente:");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SENDER_EMAIL:", process.env.SENDER_EMAIL);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Exemplo: 'mail.ops.team' ou 'localhost'
  port: process.env.SMTP_PORT, // Exemplo: 587
  secure: false, // Não usa TLS por padrão em 587, deixa como `false`
  tls: {
      rejectUnauthorized: false, // Ignorar problemas de certificado (para teste local)
    },
  // Removido o bloco de autenticação, pois não é necessário sem autenticação
  // auth: {
  //   user: process.env.SMTP_USER,
  //   pass: process.env.SMTP_PASS,
  // },
});

exports.sendAndLog = async (event) => {
  console.log("Lambda iniciado");
  try {
    const body = JSON.parse(event.body);
    console.log("Body recebido:", body);

    const { to, subject, message } = body;

    const mailOptions = {
      from: process.env.SENDER_EMAIL, // O e-mail de origem (exemplo: "no-reply@ops.team")
      to,
      subject,
      text: message,
    };

    console.log("Enviando email via Postfix (SMTP)...");

    // Enviando o e-mail sem autenticação
    const emailResponse = await transporter.sendMail(mailOptions);

    console.log("Email enviado com sucesso:", emailResponse);

    // Log no DynamoDB
    const logItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      to,
      subject,
      message,
      result: "success",
      messageId: emailResponse.messageId,
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
      body: JSON.stringify({ ok: true, messageId: emailResponse.messageId }),
    };
  } catch (error) {
    console.error("Erro:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};
