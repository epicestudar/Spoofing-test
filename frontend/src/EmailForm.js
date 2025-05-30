import { useState, useEffect } from "react";
import styles from "./EmailForm.module.css";
import { FiAtSign, FiMessageSquare, FiMail } from "react-icons/fi";
import logoOpsteam from "./assets/opsteam.webp";
import badgeAws from "./assets/badge.png";
import { logoutUri, cognitoDomain, clientId } from "./authConfig";

export default function EmailForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinSent, setPinSent] = useState(false);
  const [lastPinTime, setLastPinTime] = useState(null);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const savedTime = localStorage.getItem("lastPinTime");
    if (savedTime) {
      const elapsed = Date.now() - parseInt(savedTime, 10);
      if (elapsed < 60000) {
        setLastPinTime(parseInt(savedTime, 10));
        setCooldownSecondsLeft(Math.ceil((60000 - elapsed) / 1000));
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (cooldownSecondsLeft > 0) {
      interval = setInterval(() => {
        setCooldownSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownSecondsLeft]);

  const signOutRedirect = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const handleStartPin = async (e) => {
    e.preventDefault();

    const now = Date.now();
    if (lastPinTime && now - lastPinTime < 60000) {
      const secondsLeft = Math.ceil((60000 - (now - lastPinTime)) / 1000);
      setCooldownSecondsLeft(secondsLeft);
      setStatus(`⏱ Aguarde ${secondsLeft}s para reenviar o PIN.`);
      return;
    }

    setStatus("Enviando PIN de verificação...");
    try {
      const res = await fetch(`${API_URL}/start-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: to }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("✅ PIN enviado. Verifique sua caixa de entrada.");
        setPinSent(true);
        setLastPinTime(now);
        localStorage.setItem("lastPinTime", now.toString());
      } else {
        setStatus(`❌ Erro ao enviar PIN: ${data.error}`);
      }
    } catch (err) {
      setStatus(`❌ Erro na requisição: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Verificando PIN e enviando e-mail...");
    try {
      const res = await fetch(`${API_URL}/verify-and-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, message, pin }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(`✅ E-mail enviado com sucesso! ID: ${data.messageId}`);
        setPinSent(false);
        setPin("");
        localStorage.removeItem("lastPinTime");
      } else {
        setStatus(`❌ Falha: ${data.error}`);
      }
    } catch (err) {
      setStatus(`❌ Erro na requisição: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logoGroup}>
          <img src={logoOpsteam} alt="Opsteam" className={styles.logoOpsteam} />
          <img src={badgeAws} alt="AWS Partner" className={styles.badgeAws} />
        </div>
        <div className={styles.menuWrapper}>
          <button className={styles.menuIcon} onClick={() => setMenuOpen(true)}>☰</button>
        </div>
        {menuOpen && (
          <div className={`${styles.fullscreenMenu} ${menuOpen ? "open" : ""}`}>
            <button className={styles.closeButton} onClick={() => setMenuOpen(false)}>&times;</button>
            <div className={styles.menuItems}>
              <div className={styles.menuItem} onClick={() => window.open("https://ops.team", "_blank")}>/ops.team</div>
              <div className={styles.menuItem} onClick={signOutRedirect}>/sair</div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.overlay}></div>

      <div className={styles.formWrapper}>
        <div className={styles.formContent}>
          <h2 className={styles.title}>Formulário</h2>

          <form onSubmit={pinSent ? handleSubmit : handleStartPin} className={styles.formFields}>
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
                placeholder="Teste de Spoofing"
                className={styles.input}
                value={subject}
                readOnly
              />
            </div>
            <div className={styles.field}>
              <FiMail className={styles.fieldIcon} />
              <textarea
                placeholder="Esté um teste de spoofing realizado pelo Opsteam. Não é um e-mail real."
                className={styles.textarea}
                value={message}
                readOnly
              />
            </div>

            {pinSent && (
              <div className={styles.pinAlert}>
                <p>🔒 Um PIN foi enviado para <strong>{to}</strong>. Insira abaixo para confirmar o envio:</p>
                <input
                  type="text"
                  placeholder="Digite o PIN"
                  className={styles.input2}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.button}>
                {pinSent ? "Confirmar Envio" : "Enviar"}
              </button>
            </div>

            {status && <p className={styles.status}>{status}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
