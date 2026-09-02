import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiLock, FiMail } from "react-icons/fi";

import "./password-recovery.css";
import logo from "../assets/logo.png";
import clinic from "../assets/clinic.jpg";

const API_URL = "http://localhost:3000/usuarios";

export default function PasswordRecovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  function showMessage(text, type) {
    setMessage(text);
    setMessageType(type);
  }

  async function verifyEmail(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}?email=${encodeURIComponent(normalizedEmail)}`
      );

      if (!response.ok) {
        throw new Error("Não foi possível consultar os usuários.");
      }

      const users = await response.json();

      if (!users.length) {
        showMessage("Não encontramos uma conta cadastrada com este e-mail.", "error");
        return;
      }

      setEmail(normalizedEmail);
      setUserId(users[0].id);
      setStep("password");
      showMessage("E-mail confirmado. Agora escolha sua nova senha.", "success");
    } catch (error) {
      console.error(error);
      showMessage(
        "Não foi possível conectar ao banco de dados. Verifique se o JSON Server está rodando.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = form.get("senha");
    const confirmPassword = form.get("confirmarSenha");

    if (password !== confirmPassword) {
      showMessage("As senhas não coincidem. Revise os campos e tente novamente.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("A nova senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: password }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar a senha.");
      }

      showMessage("Senha alterada com sucesso! Você será redirecionado para o login.", "success");
      setStep("success");

      window.setTimeout(() => navigate("/"), 1800);
    } catch (error) {
      console.error(error);
      showMessage(
        "Não foi possível alterar sua senha. Tente novamente em instantes.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src={clinic} alt="SC Medic" className="auth-background" />
        <div className="auth-overlay">
          <img src={logo} className="auth-logo" alt="SC Medic" />
          <div className="auth-content">
            <span className="auth-small-title">SC MEDIC</span>
            <h1>Estamos aqui para ajudar você a voltar à sua conta.</h1>
            <p>
              Confirme seu e-mail cadastrado e crie uma nova senha para continuar
              aproveitando todos os nossos serviços.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card recovery-card">
          <Link className="back-to-login" to="/">
            <FiArrowLeft /> Voltar para o login
          </Link>

          <span className="auth-welcome">RECUPERAÇÃO DE ACESSO</span>
          <h2>{step === "email" ? "Esqueceu sua senha?" : "Crie uma nova senha"}</h2>
          <p className="auth-description">
            {step === "email"
              ? "Informe o e-mail cadastrado para localizar sua conta."
              : step === "password"
              ? `Defina uma senha segura para a conta ${email}.`
              : "Sua senha foi atualizada. Você já pode entrar na sua conta."}
          </p>

          {message && (
            <div className={`recovery-message ${messageType}`} role="alert">
              {messageType === "success" && <FiCheckCircle />}
              <span>{message}</span>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={verifyEmail}>
              <label htmlFor="recovery-email">E-mail cadastrado</label>
              <div className="auth-input">
                <FiMail />
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Digite seu e-mail"
                  required
                  autoComplete="email"
                />
              </div>
              <button className="auth-button" type="submit" disabled={loading}>
                {loading ? "Verificando..." : "Continuar"}
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={resetPassword}>
              <label htmlFor="new-password">Nova senha</label>
              <div className="auth-input">
                <FiLock />
                <input
                  id="new-password"
                  name="senha"
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  required
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>

              <label htmlFor="confirm-password">Confirme a nova senha</label>
              <div className="auth-input">
                <FiLock />
                <input
                  id="confirm-password"
                  name="confirmarSenha"
                  type="password"
                  placeholder="Digite novamente sua senha"
                  required
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>

              <button className="auth-button" type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Alterar senha"}
              </button>
            </form>
          )}

          {step === "success" && <div className="recovery-success-space" />}
        </div>
      </div>
    </div>
  );
}
