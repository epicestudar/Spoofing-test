# 🛡️ Spoofing Test - Projeto Interno

Este é um projeto **interno da empresa Ops Team** desenvolvido com o objetivo de testar a eficácia de políticas de segurança de e-mail como **SPF**, **DKIM** e **DMARC** através do envio de e-mails forjados (spoofing controlado).

O foco é auxiliar em auditorias e validação de infraestrutura de segurança de e-mails corporativos.

---

## 📬 O que este projeto faz

Este sistema permite que um usuário envie um e-mail com um campo "From" personalizado, simulando diferentes cenários de spoofing. O envio é feito por uma função AWS Lambda, que utiliza um servidor SMTP próprio (Postfix em EC2) para encaminhar os e-mails.

Logs de cada envio são armazenados em uma tabela DynamoDB, possibilitando rastreamento e auditoria.

---

## ☁️ Serviços AWS Utilizados

| Serviço         | Função                                                                 |
|-----------------|------------------------------------------------------------------------|
| **Lambda**      | Função `sendAndLog` que processa e envia e-mails usando Nodemailer     |
| **API Gateway** | Expõe a rota `POST /send` da Lambda para ser consumida via frontend    |
| **DynamoDB**    | Armazena logs dos envios com metadados importantes                     |
| **EC2**         | Hospeda o servidor SMTP (Postfix) usado como relay                     |
| **Route 53**    | Gerencia DNS do domínio remetente (`ops.team`)                         |
| **CloudFront**  | Distribuição do frontend com CORS integrado                            |

---

## 🧪 Tecnologias Utilizadas

| Categoria         | Tecnologias                            |
|-------------------|----------------------------------------|
| **Frontend**      | React, CSS Modules, Vite               |
| **Backend**       | Node.js (Lambda), Nodemailer           |
| **Infraestrutura**| AWS Lambda, API Gateway, EC2 (Postfix), DynamoDB, Route 53 |
| **DevOps**        | AWS SAM (Serverless Application Model) |
| **DNS**           | SPF, DKIM, DMARC                       |

---

## 🔐 Configurações de Segurança (DNS)

- **SPF**: Define que apenas o IP do servidor SMTP pode enviar e-mails pelo domínio.
- **DKIM** *(opcional)*: Assinatura criptográfica configurada no Postfix.
- **DMARC** *(recomendado)*: Relatório de falhas em `p=none`.




---

## 🚀 Deploy com AWS SAM

Para build e deploy da aplicação:

```bash
sam build
sam deploy --guided
```

Após isso, a função **Lambda**, **API Gateway**, variáveis de ambiente e permissões serão atualizadas na AWS.

---

## 💻 Uso do Frontend

O formulário React permite preencher os seguintes campos:

- **Remetente (`from`)** – E-mail forjado (spoofed)
- **Destinatário (`to`)** – Quem vai receber o e-mail
- **Assunto (`subject`)**
- **Mensagem (`message`)**

A requisição **POST** é enviada para o endpoint `/send`, exposto pela **API Gateway**.

---

## 🧠 Desenvolvedores do Projeto

<div align=center>
  <table style="width: 100%">
    <tbody>
      <tr align=center>
        <th><strong> Vinícius G. Feitoza </br> epicestudar </strong></th>
        <th><strong> Lucas Robiati </br> Casiati </strong></th>
      </tr>
      <tr align=center>
        <td>
          <a href="https://github.com/epicestudar">
            <img width="250" height="250" style="border-radius: 50%;" src="https://avatars.githubusercontent.com/epicestudar">
          </a>
        </td>
        <td>
          <a href="https://github.com/Casiati">
            <img width="250" height="250" style="border-radius: 50%;" src="https://avatars.githubusercontent.com/Casiati">
          </a>
        </td>
      </tr>
    </tbody>

  </table>
</div>


## 📝 Observações Finais

> Este projeto é de uso restrito para fins de **teste controlado** em ambientes autorizados.  
> O envio de e-mails forjados deve sempre respeitar **normas legais e éticas**.  
> O uso indevido pode violar **políticas da AWS** e **legislações locais**.
