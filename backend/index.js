const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");

// DynamoDB client
const dynamo = new AWS.DynamoDB.DocumentClient();

// Variáveis de ambiente
const PIN_TABLE = process.env.PIN_TABLE;
const LOG_TABLE = process.env.LOG_TABLE;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT);

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

// Valida formato de e-mail (melhorado)
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && emailRegex.test(email);
}

// Função router principal
exports.router = async (event) => {
  const path = event.rawPath || event.path;
  console.log("Path recebido:", path);

  if (path === "/start-verification") {
    return exports.startVerification(event);
  } else if (path === "/verify-and-send") {
    return exports.verifyAndSend(event);
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Rota não encontrada" }),
  };
};

// Função: Inicia a verificação
exports.startVerification = async (event) => {
  console.log("=== START VERIFICATION ===");
  console.log("Body recebido:", event.body);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    console.log("E-mail para verificação:", email);

    if (!isValidEmail(email)) {
      console.warn("E-mail inválido:", email);
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: "E-mail inválido." }),
      };
    }

    const pin = generatePin();
    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutos
    const now = new Date().toISOString();

    console.log(
      `PIN gerado: ${pin} | Expira em: ${new Date(
        expiresAt * 1000
      ).toISOString()}`
    );

    // Salvar PIN no DynamoDB
    console.log("Salvando PIN no DynamoDB...");
    await dynamo
      .put({
        TableName: PIN_TABLE,
        Item: {
          email: email, // Chave: email do usuário
          pin,
          expiresAt,
          createdAt: now,
          attempts: 0, // Contador de tentativas
        },
      })
      .promise();
    console.log("✅ PIN salvo com sucesso");

    // Enviar e-mail com PIN
    console.log("Enviando e-mail com PIN...");
    const emailInfo = await transporter.sendMail({
      from: '"Opsteam Security" <no-reply@ops.team>',
      to: email,
      subject: "Seu PIN de verificação - Teste de Spoofing",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verificação de Segurança</h2>
          <p>Olá,</p>
          <p>Você solicitou um teste de spoofing de e-mail. Use o código abaixo para continuar:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #667eea; letter-spacing: 5px; margin: 0;">${pin}</h1>
          </div>
          <p><strong>⏱ Este código expira em 5 minutos.</strong></p>
          <p style="color: #666; font-size: 14px;">Se você não solicitou este teste, ignore este e-mail.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Este é um e-mail automático enviado pelo sistema de testes de segurança da Opsteam.
          </p>
        </div>
      `,
      text: `Seu código de verificação é: ${pin}\n\nEle expira em 5 minutos.\n\nSe você não solicitou este teste, ignore este e-mail.`,
    });
    console.log("✅ E-mail enviado:", emailInfo.messageId);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: true,
        message: "PIN enviado com sucesso!",
        messageId: emailInfo.messageId,
      }),
    };
  } catch (error) {
    console.error("❌ Erro ao iniciar verificação:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};

// Função: Verifica o PIN e envia e-mail de spoofing
exports.verifyAndSend = async (event) => {
  console.log("=== VERIFY AND SEND ===");
  console.log("Body recebido:", event.body);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    const { from, to, pin } = JSON.parse(event.body);
    const subject = "Teste de Spoofing";
    const message =
      "Este é um teste de spoofing realizado pelo Opsteam. Não é um e-mail real.";

    console.log("Parâmetros recebidos:", {
      from,
      to,
      pin: pin ? "***" : "undefined",
    });

    // Validações
    if (!isValidEmail(from) || !isValidEmail(to)) {
      console.warn("E-mail(s) inválido(s):", { from, to });
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: "Endereço de e-mail inválido.",
        }),
      };
    }

    if (!pin || pin.length !== 6) {
      console.warn("PIN inválido ou ausente");
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: "PIN deve ter 6 dígitos.",
        }),
      };
    }

    // Como from e to são iguais, podemos usar qualquer um para buscar o PIN
    // Vamos usar o 'to' para manter consistência
    console.log(`Buscando PIN para: ${to}`);
    const { Item } = await dynamo
      .get({
        TableName: PIN_TABLE,
        Key: { email: to },
      })
      .promise();

    console.log("Item encontrado:", Item ? "Sim" : "Não");

    const now = Math.floor(Date.now() / 1000);

    // Verificações de segurança
    if (!Item) {
      console.warn("PIN não encontrado para o email:", to);
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: "PIN não encontrado. Solicite um novo código.",
        }),
      };
    }

    if (Item.expiresAt < now) {
      console.warn("PIN expirado:", {
        expiresAt: new Date(Item.expiresAt * 1000).toISOString(),
        now: new Date(now * 1000).toISOString(),
      });
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: "PIN expirado. Solicite um novo código.",
        }),
      };
    }

    if (Item.pin !== pin) {
      // Incrementar contador de tentativas
      const newAttempts = (Item.attempts || 0) + 1;
      await dynamo
        .update({
          TableName: PIN_TABLE,
          Key: { email: to },
          UpdateExpression: "SET attempts = :attempts",
          ExpressionAttributeValues: { ":attempts": newAttempts },
        })
        .promise();

      console.warn(`PIN incorreto. Tentativa ${newAttempts} de 3`);

      if (newAttempts >= 3) {
        // Deletar PIN após 3 tentativas falhas
        await dynamo
          .delete({
            TableName: PIN_TABLE,
            Key: { email: to },
          })
          .promise();

        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            ok: false,
            error:
              "Número máximo de tentativas excedido. Solicite um novo código.",
          }),
        };
      }

      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          ok: false,
          error: `PIN incorreto. ${3 - newAttempts} tentativas restantes.`,
        }),
      };
    }

    // PIN válido - enviar e-mail de spoofing
    console.log("✅ PIN válido! Enviando e-mail de spoofing...");
    const spoofEmail = await transporter.sendMail({
      from: from, // Email do remetente (spoofing)
      to: to, // Email do destinatário
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #ff0000; padding: 20px;">
          <h1 style="color: #ff0000; text-align: center;">⚠️ TESTE DE SPOOFING ⚠️</h1>
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #856404;">
              <strong>ATENÇÃO:</strong> ${message}
            </p>
          </div>
          <p>Este e-mail foi enviado como se fosse de: <strong>${from}</strong></p>
          <p>Mas na realidade foi enviado através do sistema de testes da Opsteam.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            Este teste demonstra como e-mails podem ser falsificados (spoofed). 
            Sempre verifique a autenticidade dos e-mails que você recebe, especialmente 
            aqueles que solicitam informações sensíveis.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            Teste realizado em: ${new Date().toLocaleString("pt-BR")}
          </p>
        </div>
      `,
      text: message,
    });
    console.log("✅ E-mail de spoofing enviado:", spoofEmail.messageId);

    // Deletar PIN após uso bem-sucedido
    await dynamo
      .delete({
        TableName: PIN_TABLE,
        Key: { email: to },
      })
      .promise();
    console.log("✅ PIN deletado após uso");

    // Registrar no log
    const logItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      date: new Date().toISOString().split("T")[0], // Para particionamento
      from,
      to,
      subject,
      result: "success",
      messageId: spoofEmail.messageId,
      sourceIp: event.requestContext?.identity?.sourceIp || "unknown",
      userAgent: event.headers?.["User-Agent"] || "unknown",
    };

    console.log("Salvando log de auditoria...");
    await dynamo.put({ TableName: LOG_TABLE, Item: logItem }).promise();
    console.log("✅ Log salvo com sucesso");

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: true,
        messageId: spoofEmail.messageId,
        message: "E-mail de teste enviado com sucesso!",
      }),
    };
  } catch (error) {
    console.error("❌ Erro ao verificar PIN e enviar e-mail:", error);

    // Log de erro
    try {
      const errorLog = {
        id: uuidv4(),
        timestamp: Date.now(),
        date: new Date().toISOString().split("T")[0],
        action: "verify-and-send",
        result: "error",
        error: error.message,
        body: event.body,
        sourceIp: event.requestContext?.identity?.sourceIp || "unknown",
      };
      await dynamo.put({ TableName: LOG_TABLE, Item: errorLog }).promise();
    } catch (logError) {
      console.error("Erro ao salvar log de erro:", logError);
    }

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Erro interno do servidor" }),
    };
  }
};
