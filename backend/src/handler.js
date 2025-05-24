const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");

// DynamoDB client
const dynamo = new AWS.DynamoDB.DocumentClient();

// Variáveis de ambiente
const PIN_TABLE = process.env.PIN_TABLE;
const LOG_TABLE = process.env.LOG_TABLE;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT); // Garante que é número

console.log("Config SMTP:", { SMTP_HOST, SMTP_PORT });
console.log("Config DynamoDB:", { PIN_TABLE, LOG_TABLE });

// Configuração do transporter SMTP
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  ignoreTLS: true,
});

transporter
  .verify()
  .then(() => {
    console.log("SMTP conectado com sucesso");
  })
  .catch((err) => {
    console.error("Erro na verificação SMTP:", err);
  });

// CORS Headers padrão
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

// Gera um PIN de 6 dígitos
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Valida formato de e-mail (simples)
function isValidEmail(email) {
  return typeof email === 'string' && email.includes('@');
}

exports.router = async (event) => {
  const path = event.rawPath || event.path;
  console.log("Path recebido:", path);

  if (path === '/start-verification') {
    return exports.startVerification(event);
  } else if (path === '/verify-and-send') {
    return exports.verifyAndSend(event);
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Rota não encontrada' }),
  };
};



// Função: Inicia a verificação
exports.startVerification = async (event) => {
  console.log("startVerification iniciado com body:", event.body);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    console.log("E-mail recebido para verificação:", email);
    const from = email;

    if (!isValidEmail(from)) {
      console.warn("E-mail inválido recebido:", from);
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: "E-mail inválido." }),
      };
    }

    const pin = generatePin();
    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutos
    console.log("PIN gerado:", pin, "expira em:", expiresAt);

    console.log("Gravando PIN no DynamoDB...");
    await dynamo
      .put({ TableName: PIN_TABLE, Item: { email: from, pin, expiresAt } })
      .promise();
    console.log("PIN gravado com sucesso");

    console.log("Enviando e-mail com PIN...");
    await transporter.sendMail({
      from: "no-reply@ops.team",
      to: from,
      subject: "Seu PIN de verificação",
      text: `Olá,\n\nSeu código de verificação é: ${pin}\n\nEle expira em 5 minutos.`,
    });
    console.log("E-mail enviado com sucesso");

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, message: "PIN enviado com sucesso!" }),
    };
  } catch (error) {
    console.error("Erro ao iniciar verificação:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};

// Função: Verifica o PIN e envia e-mail
exports.verifyAndSend = async (event) => {
  console.log("verifyAndSend iniciado com body:", event.body);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    const { from, to, subject, message, pin } = JSON.parse(event.body);
    console.log("Parâmetros recebidos:", { from, to, subject, pin });

    if (!isValidEmail(from) || !isValidEmail(to)) {
      console.warn("Endereço(s) de e-mail inválido(s):", { from, to });
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: "Endereço de e-mail inválido.",
        }),
      };
    }

    console.log("Buscando PIN no DynamoDB...");
    const { Item } = await dynamo
      .get({ TableName: PIN_TABLE, Key: { email: from } })
      .promise();
    console.log("Item recuperado do DynamoDB:", Item);

    const now = Math.floor(Date.now() / 1000);

    if (!Item || Item.pin !== pin || Item.expiresAt < now) {
      console.warn("PIN inválido, inexistente ou expirado:", {
        pin,
        now,
        item: Item,
      });
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: "PIN não encontrado ou expirado.",
        }),
      };
    }

    console.log("PIN válido, enviando e-mail...");
    const emailResponse = await transporter.sendMail({
      from,
      to,
      subject,
      text: message,
    });
    console.log(
      "E-mail enviado com sucesso, messageId:",
      emailResponse.messageId
    );

    const logItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      from,
      to,
      subject,
      message,
      result: "success",
      messageId: emailResponse.messageId,
    };
    console.log("Gravando log no DynamoDB...");
    await dynamo.put({ TableName: LOG_TABLE, Item: logItem }).promise();
    console.log("Log gravado com sucesso");

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, messageId: emailResponse.messageId }),
    };
  } catch (error) {
    console.error("Erro ao verificar PIN e enviar e-mail:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};

// Função: Envio direto sem PIN (usado para testes ou bypass)
/*exports.sendAndLog = async (event) => {
  console.log("sendAndLog iniciado com body:", event.body);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    const { from, to, subject, message } = JSON.parse(event.body);
    console.log("Parâmetros recebidos:", { from, to, subject });

    if (!isValidEmail(from) || !isValidEmail(to)) {
      console.warn("Endereço(s) de e-mail inválido(s):", { from, to });
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: "Endereço de e-mail inválido.",
        }),
      };
    }

    console.log("Enviando e-mail direto...");
    const emailResponse = await transporter.sendMail({
      from,
      to,
      subject,
      text: message,
    });
    console.log(
      "E-mail enviado com sucesso, messageId:",
      emailResponse.messageId
    );

    const logItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      from,
      to,
      subject,
      message,
      result: "success",
      messageId: emailResponse.messageId,
    };
    console.log("Gravando log no DynamoDB...");
    await dynamo.put({ TableName: LOG_TABLE, Item: logItem }).promise();
    console.log("Log gravado com sucesso");

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, messageId: emailResponse.messageId }),
    };
  } catch (error) {
    console.error("Erro no envio direto:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
}*/;