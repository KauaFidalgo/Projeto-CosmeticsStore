import "../components/login.css";
import "./forgot-password.css";

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiArrowLeft,
  FiKey,
} from "react-icons/fi";

import logo from "../assets/logo.png";
import clinic from "../assets/clinic.jpg";

import { enviarCodigoPorEmail } from "../utils/emailSimulado";

const TEMPO_EXPIRACAO_MINUTOS = 5;
const LIMITE_TENTATIVAS = 5;

function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState("email"); // email | codigo | senha | concluido

  const [email, setEmail] = useState("");
  const [usuarioId, setUsuarioId] = useState(null);

  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [recuperacaoAtual, setRecuperacaoAtual] = useState(null);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [segundosParaReenvio, setSegundosParaReenvio] = useState(0);

  // =========================
  // CONTADOR DE REENVIO
  // =========================

  useEffect(() => {
    if (segundosParaReenvio <= 0) return;

    const timer = setInterval(() => {
      setSegundosParaReenvio((atual) => atual - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [segundosParaReenvio]);

  // =========================
  // ETAPA 1: SOLICITAR CÓDIGO
  // =========================

  async function solicitarCodigo(e) {
    e.preventDefault();
    setErro("");

    const emailFormatado = email.trim().toLowerCase();

    if (!emailFormatado) {
      setErro("Informe um e-mail.");
      return;
    }

    setCarregando(true);

    try {
      const respostaUsuario = await fetch(
        `http://localhost:3000/usuarios?email=${encodeURIComponent(
          emailFormatado
        )}`
      );

      if (!respostaUsuario.ok) {
        throw new Error("Erro ao verificar e-mail.");
      }

      const usuarios = await respostaUsuario.json();

      if (usuarios.length === 0) {
        setErro("Não existe nenhuma conta cadastrada com este e-mail.");
        setCarregando(false);
        return;
      }

      const usuario = usuarios[0];
      setUsuarioId(usuario.id);

      const codigo = gerarCodigo();
      const agora = new Date();
      const expiraEm = new Date(
        agora.getTime() + TEMPO_EXPIRACAO_MINUTOS * 60 * 1000
      );

      const novaRecuperacao = {
        email: emailFormatado,
        codigo,
        criadoEm: agora.toISOString(),
        expiraEm: expiraEm.toISOString(),
        usado: false,
        tentativas: 0,
      };

      const respostaCriacao = await fetch(
        "http://localhost:3000/recuperacoes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novaRecuperacao),
        }
      );

      if (!respostaCriacao.ok) {
        throw new Error("Erro ao gerar código de recuperação.");
      }

      const recuperacaoCriada = await respostaCriacao.json();

      setRecuperacaoAtual(recuperacaoCriada);
      setEmail(emailFormatado);

      await enviarCodigoPorEmail(emailFormatado, codigo);

      setSegundosParaReenvio(30);
      setEtapa("codigo");
    } catch (error) {
      console.error(error);
      setErro(
        "Não foi possível processar sua solicitação. Verifique se o JSON Server está rodando."
      );
    } finally {
      setCarregando(false);
    }
  }

  // =========================
  // REENVIAR CÓDIGO
  // =========================

  async function reenviarCodigo() {
    if (segundosParaReenvio > 0) return;

    setErro("");
    setCarregando(true);

    try {
      const codigo = gerarCodigo();
      const agora = new Date();
      const expiraEm = new Date(
        agora.getTime() + TEMPO_EXPIRACAO_MINUTOS * 60 * 1000
      );

      const novaRecuperacao = {
        email,
        codigo,
        criadoEm: agora.toISOString(),
        expiraEm: expiraEm.toISOString(),
        usado: false,
        tentativas: 0,
      };

      const resposta = await fetch("http://localhost:3000/recuperacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaRecuperacao),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao gerar novo código.");
      }

      const recuperacaoCriada = await resposta.json();

      setRecuperacaoAtual(recuperacaoCriada);
      setCodigoDigitado("");

      await enviarCodigoPorEmail(email, codigo);

      setSegundosParaReenvio(30);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível reenviar o código.");
    } finally {
      setCarregando(false);
    }
  }

  // =========================
  // ETAPA 2: VALIDAR CÓDIGO
  // =========================

  async function validarCodigo(e) {
    e.preventDefault();
    setErro("");

    if (!codigoDigitado.trim()) {
      setErro("Digite o código recebido.");
      return;
    }

    if (!recuperacaoAtual) {
      setErro("Solicite um novo código.");
      setEtapa("email");
      return;
    }

    if (recuperacaoAtual.tentativas >= LIMITE_TENTATIVAS) {
      setErro("Limite de tentativas excedido. Solicite um novo código.");
      return;
    }

    const agora = new Date();
    const expiraEm = new Date(recuperacaoAtual.expiraEm);

    if (agora > expiraEm) {
      setErro("Este código expirou. Solicite um novo código.");
      return;
    }

    if (recuperacaoAtual.usado) {
      setErro("Este código já foi utilizado. Solicite um novo código.");
      return;
    }

    if (codigoDigitado.trim() !== recuperacaoAtual.codigo) {
      const tentativasAtualizadas = recuperacaoAtual.tentativas + 1;

      try {
        await fetch(
          `http://localhost:3000/recuperacoes/${recuperacaoAtual.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tentativas: tentativasAtualizadas }),
          }
        );
      } catch (error) {
        console.error(error);
      }

      setRecuperacaoAtual({
        ...recuperacaoAtual,
        tentativas: tentativasAtualizadas,
      });

      setErro(
        `Código incorreto. Tentativas restantes: ${
          LIMITE_TENTATIVAS - tentativasAtualizadas
        }.`
      );

      return;
    }

    setEtapa("senha");
  }

  // =========================
  // ETAPA 3: NOVA SENHA
  // =========================

  async function salvarNovaSenha(e) {
    e.preventDefault();
    setErro("");

    if (!novaSenha || !confirmarNovaSenha) {
      setErro("Preencha os dois campos de senha.");
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    setCarregando(true);

    try {
      const respostaSenha = await fetch(
        `http://localhost:3000/usuarios/${usuarioId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senha: novaSenha }),
        }
      );

      if (!respostaSenha.ok) {
        throw new Error("Erro ao atualizar a senha.");
      }

      await fetch(
        `http://localhost:3000/recuperacoes/${recuperacaoAtual.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usado: true }),
        }
      );

      setEtapa("concluido");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível salvar a nova senha. Tente novamente.");
    } finally {
      setCarregando(false);
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

            <h1>Vamos recuperar o acesso à sua conta.</h1>

            <p>
              Siga os passos abaixo para redefinir sua senha com
              segurança através da verificação por e-mail.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <Link className="forgot-back" to="/">
            <FiArrowLeft />
            Voltar ao login
          </Link>

          {/* ================= ETAPA EMAIL ================= */}

          {etapa === "email" && (
            <>
              <span className="auth-welcome">Esqueci minha senha</span>
              <h2>Recuperar acesso</h2>
              <p className="auth-description">
                Informe o e-mail cadastrado para receber um código de
                verificação.
              </p>

              <form onSubmit={solicitarCodigo}>
                <label htmlFor="email">E-mail</label>

                <div className="auth-input">
                  <FiMail />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    required
                  />
                </div>

                {erro && <p className="forgot-error">{erro}</p>}

                <button
                  type="submit"
                  className="auth-button"
                  disabled={carregando}
                >
                  {carregando ? "Enviando..." : "Enviar código"}
                  <FiArrowRight />
                </button>
              </form>
            </>
          )}

          {/* ================= ETAPA CÓDIGO ================= */}

          {etapa === "codigo" && (
            <>
              <span className="auth-welcome">Verificação</span>
              <h2>Digite o código</h2>
              <p className="auth-description">
                Enviamos um código de 6 dígitos para{" "}
                <strong>{email}</strong>. Ele expira em{" "}
                {TEMPO_EXPIRACAO_MINUTOS} minutos.
              </p>

              <form onSubmit={validarCodigo}>
                <label htmlFor="codigo">Código de verificação</label>

                <div className="auth-input">
                  <FiKey />
                  <input
                    id="codigo"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    value={codigoDigitado}
                    onChange={(e) => setCodigoDigitado(e.target.value)}
                    placeholder="000000"
                    required
                  />
                </div>

                {erro && <p className="forgot-error">{erro}</p>}

                <button
                  type="submit"
                  className="auth-button"
                  disabled={carregando}
                >
                  Verificar código
                  <FiArrowRight />
                </button>

                <button
                  type="button"
                  className="forgot-resend"
                  onClick={reenviarCodigo}
                  disabled={segundosParaReenvio > 0 || carregando}
                >
                  {segundosParaReenvio > 0
                    ? `Reenviar código em ${segundosParaReenvio}s`
                    : "Reenviar código"}
                </button>
              </form>
            </>
          )}

          {/* ================= ETAPA NOVA SENHA ================= */}

          {etapa === "senha" && (
            <>
              <span className="auth-welcome">Quase lá</span>
              <h2>Criar nova senha</h2>
              <p className="auth-description">
                Código verificado com sucesso. Escolha uma nova senha
                para sua conta.
              </p>

              <form onSubmit={salvarNovaSenha}>
                <label htmlFor="novaSenha">Nova senha</label>

                <div className="auth-input">
                  <FiLock />
                  <input
                    id="novaSenha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite a nova senha"
                    minLength="6"
                    required
                  />
                </div>

                <label htmlFor="confirmarNovaSenha">
                  Confirmar nova senha
                </label>

                <div className="auth-input">
                  <FiLock />
                  <input
                    id="confirmarNovaSenha"
                    type="password"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    placeholder="Digite a senha novamente"
                    minLength="6"
                    required
                  />
                </div>

                {erro && <p className="forgot-error">{erro}</p>}

                <button
                  type="submit"
                  className="auth-button"
                  disabled={carregando}
                >
                  {carregando ? "Salvando..." : "Salvar nova senha"}
                  <FiArrowRight />
                </button>
              </form>
            </>
          )}

          {/* ================= ETAPA CONCLUÍDO ================= */}

          {etapa === "concluido" && (
            <div className="forgot-success">
              <span className="auth-welcome">Tudo certo!</span>
              <h2>Senha alterada com sucesso</h2>

              <p className="auth-description">
                Sua senha foi atualizada. Agora você já pode entrar com
                a nova senha.
              </p>

              <button
                className="auth-button"
                onClick={() => navigate("/", { replace: true })}
              >
                Ir para o login
                <FiArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}