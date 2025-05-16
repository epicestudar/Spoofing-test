import { useState } from "react";
import styles from "./EmailForm.module.css";
import { FiAtSign, FiMessageSquare, FiMail } from "react-icons/fi";
import logoOpsteam from "./assets/opsteam.webp";
import badgeAws from "./assets/badge.png";

export default function EmailForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Enviando...");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from ,to, subject, message }),
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
      {/* Header com Logo */}
      <div className={styles.header}>
        <div className={styles.logoGroup}>
          <img
            src={logoOpsteam} alt="Opsteam" className={styles.logoOpsteam} />
          <img src={badgeAws} alt="AWS Partner" className={styles.badgeAws} />
        </div>
        <div className={styles.menuWrapper}>
          <button className={styles.menuIcon} onClick={() => setMenuOpen(true)}>☰</button>
        </div>
        {menuOpen && (
          <div className={`${styles.fullscreenMenu} ${menuOpen ? 'open' : ''}`}>
            <button className={styles.closeButton} onClick={() => setMenuOpen(false)}>&times;</button>

            <div className={styles.menuItems}>
               {/* <div className={styles.menuItem} onClick={() => { setStep(1); setMenuOpen(false); }}>/autenticação</div> 
               <div className={styles.menuItem} onClick={() => { setStep(2); setMenuOpen(false); }}>/enviar_e-mail</div>*/}
              <div className={styles.menuItem} onClick={() => { window.open('https://ops.team', '_blank'); setMenuOpen(false); }}>/ops.team</div>
            </div>
          </div>
        )}
      </div>
        <div className={styles.overlay}></div>
      <div className={styles.formWrapper}>
        {/* Conteúdo do Formulário */}
        <div className={styles.formContent}>
          <h2 className={styles.title}>Formulário</h2>

          <form onSubmit={handleSubmit} className={styles.formFields}>
            <div className={styles.field}>
              <FiAtSign className={styles.fieldIcon} />
              <input
                type="email"
                placeholder="Remetente"
                className={styles.input}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
              />
            </div>
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

            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.button}>
                Enviar
              </button>
            </div>

            {status && <p className={styles.status}>{status}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
