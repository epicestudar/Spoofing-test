const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { putPin, getPin, logEmail } = require('./db');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  tls: { rejectUnauthorized: false },
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.startVerification = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    const { email } = JSON.parse(event.body);
    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: "E-mail inválido." }),
      };
    }

    const pin = generatePin();
    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;

    await putPin(email, pin, expiresAt);

    await transporter.sendMail({
      from: "no-reply@ops.team",
      to: email,
      subject: "Seu PIN de verificação",
      text: `Seu código de verificação é: ${pin}`,
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, message: "PIN enviado com sucesso!" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};

exports.verifyAndSend = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    const { from, to, subject, message, pin } = JSON.parse(event.body);
    if (!isValidEmail(from) || !isValidEmail(to)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: "E-mails inválidos" }),
      };
    }

    const record = await getPin(from);
    const now = Math.floor(Date.now() / 1000);

    if (!record || record.pin !== pin || record.expiresAt < now) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: "PIN inválido ou expirado" }),
      };
    }

    const emailResponse = await transporter.sendMail({ from, to, subject, text: message });

    await logEmail({
      id: uuidv4(),
      timestamp: Date.now(),
      from,
      to,
      subject,
      message,
      result: "success",
      messageId: emailResponse.messageId,
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, messageId: emailResponse.messageId }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};

exports.sendAndLog = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    const { from, to, subject, message } = JSON.parse(event.body);

    const emailResponse = await transporter.sendMail({ from, to, subject, text: message });

    await logEmail({
      id: uuidv4(),
      timestamp: Date.now(),
      from,
      to,
      subject,
      message,
      result: "success",
      messageId: emailResponse.messageId,
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true, messageId: emailResponse.messageId }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};
