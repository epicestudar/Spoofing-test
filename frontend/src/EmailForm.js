import { useState } from "react";
import styles from "./EmailForm.module.css";
import { FiAtSign, FiMessageSquare, FiMail, FiMenu } from "react-icons/fi";
import logoOpsteam from "./assets/opsteam.jpeg";
import badgeAws from "./assets/badge.png";

export default function EmailForm() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Enviando...");
    try {
      const res = await fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      });
      const data = await res.json();
      if (data.ok) setStatus(`✅ Enviado! ID: ${data.messageId}`);
      else setStatus(`❌ Erro: ${data.error}`);
    } catch (err) {
      setStatus(`❌ Falha na requisição: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logoGroup}>
          <img src={logoOpsteam} alt="Opsteam" height={40} />
          <img src={badgeAws} alt="AWS Partner" height={40} />
        </div>
        <FiMenu className={styles.menuIcon} />
      </div>

      <div className={styles.overlay} />

      <form onSubmit={handleSubmit} className={styles.card}>
        <h2 className={styles.title}>Formulário</h2>

        <div className={styles.field}>
          <FiAtSign className={styles.fieldIcon} />
          <input
            type="email"
            placeholder="Destinatário"
            className={styles.input}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <FiMessageSquare className={styles.fieldIcon} />
          <input
            type="text"
            placeholder="Assunto"
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <FiMail className={styles.fieldIcon} />
          <textarea
            placeholder="Mensagem"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={styles.button}>
          Enviar
        </button>

        {status && <p className={styles.status}>{status}</p>}
      </form>
    </div>
  );
}
