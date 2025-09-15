// frontend/src/EmailForm.js

import { useState, useEffect } from "react";
import styles from "./EmailForm.module.css";
import { FiAtSign, FiMessageSquare, FiMail } from "react-icons/fi";
import logoOpsteam from "./assets/opsteam.webp";
import badgeAws from "./assets/badge.png";

export default function EmailForm() {
  const [email, setEmail] = useState(""); // Campo único para email
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
        body: JSON.stringify({ email: email }),
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
        body: JSON.stringify({
          from: email,
          to: email,
          subject: "Teste de Spoofing",
          message:
            "Este é um teste de spoofing realizado pelo Opsteam. Não é um e-mail real.",
          pin,
        }),
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
          <button className={styles.menuIcon} onClick={() => setMenuOpen(true)}>
            ☰
          </button>
        </div>
        {menuOpen && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
              <button
                className={styles.closeButton}
                onClick={() => setMenuOpen(false)}
              >
                &times;
              </button>
              <a
                href="https://ops.team"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.modalLink}
              >
                Opsteam
              </a>
            </div>
          </div>
        )}
      </div>

      <div className={styles.overlay}></div>

      <div className={styles.formWrapper}>
        <div className={styles.formContent}>
          <h2 className={styles.title}>Teste de Spoofing</h2>
          <p className={styles.subtitle}>
            Digite seu e-mail para receber um teste de spoofing
          </p>

          <form
            onSubmit={pinSent ? handleSubmit : handleStartPin}
            className={styles.formFields}
          >
            <div className={styles.field}>
              <FiAtSign className={styles.fieldIcon} />
              <input
                type="email"
                placeholder="Seu e-mail"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={pinSent} // Desabilita o campo após enviar o PIN
              />
            </div>

            <div className={styles.infoBox}>
              <p className={styles.infoText}>
                📧 <strong>Assunto:</strong> Teste de Spoofing
              </p>
              <p className={styles.infoText}>
                📝 <strong>Mensagem:</strong> Este é um teste de spoofing
                realizado pelo Opsteam. Não é um e-mail real.
              </p>
            </div>

            {pinSent && (
              <div className={styles.pinAlert}>
                <p>
                  🔒 Um PIN foi enviado para <strong>{email}</strong>. Insira
                  abaixo para confirmar o envio:
                </p>
                <input
                  type="text"
                  placeholder="Digite o PIN de 6 dígitos"
                  className={styles.pinInput}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                  autoFocus
                />
              </div>
            )}

            <div className={styles.buttonContainer}>
              <button type="submit" className={styles.button}>
                {pinSent ? "Confirmar e Enviar" : "Solicitar PIN"}
              </button>

              {pinSent && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setPinSent(false);
                    setPin("");
                    setStatus(null);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>

            {status && (
              <p
                className={`${styles.status} ${
                  status.includes("✅")
                    ? styles.success
                    : status.includes("❌")
                    ? styles.error
                    : styles.info
                }`}
              >
                {status}
              </p>
            )}
          </form>

      
        </div>
      </div>
    </div>
  );
}
