import "./home.css";
import "./profile.css";

import Footer from "../components/Footer";
import Header from "../components/Header";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiUser,
  FiMail,
  FiMapPin,
  FiEdit2,
  FiCheck,
  FiX,
} from "react-icons/fi";

import { enderecoVazio, formatarEndereco } from "../utils/endereco";

export default function Profile() {
  const navigate = useNavigate();

  const [usuarioId, setUsuarioId] = useState(null);
  const [nome, setNome] = useState("");

  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState(enderecoVazio);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ email: "", ...enderecoVazio });

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // =========================
  // CARREGAR USUÁRIO
  // =========================

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) {
      navigate("/", { replace: true });
      return;
    }

    let usuarioLocal;

    try {
      usuarioLocal = JSON.parse(usuarioSalvo);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      navigate("/", { replace: true });
      return;
    }

    async function carregarUsuario() {
      try {
        const resposta = await fetch(
          `http://localhost:3000/usuarios/${usuarioLocal.id}`
        );

        if (!resposta.ok) {
          throw new Error("Usuário não encontrado.");
        }

        const dados = await resposta.json();
        aplicarUsuario(dados);
      } catch (error) {
        console.error("Erro ao buscar perfil no servidor:", error);
        aplicarUsuario(usuarioLocal);
      } finally {
        setCarregando(false);
      }
    }

    carregarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  function aplicarUsuario(dados) {
    const enderecoAtual = { ...enderecoVazio, ...(dados.endereco || {}) };

    setUsuarioId(dados.id);
    setNome(dados.nome || "");
    setEmail(dados.email || "");
    setEndereco(enderecoAtual);

    setForm({ email: dados.email || "", ...enderecoAtual });

    localStorage.setItem("usuarioLogado", JSON.stringify(dados));
  }

  // =========================
  // EDITAR PERFIL
  // =========================

  function alterarCampo(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function abrirEdicao() {
    setForm({ email, ...endereco });
    setErro("");
    setEditando(true);
  }

  function cancelarEdicao() {
    setForm({ email, ...endereco });
    setErro("");
    setEditando(false);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    setErro("");

    const emailFormatado = form.email.trim().toLowerCase();

    if (!emailFormatado) {
      setErro("Informe um e-mail válido.");
      return;
    }

    const enderecoAtualizado = {
      cep: form.cep.trim(),
      rua: form.rua.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim(),
    };

    setSalvando(true);

    try {
      const resposta = await fetch(
        `http://localhost:3000/usuarios/${usuarioId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailFormatado,
            endereco: enderecoAtualizado,
          }),
        }
      );

      if (!resposta.ok) {
        throw new Error("Erro ao salvar perfil.");
      }

      const usuarioAtualizado = await resposta.json();

      aplicarUsuario(usuarioAtualizado);
      setEditando(false);
    } catch (error) {
      console.error(error);
      setErro(
        "Não foi possível salvar suas alterações. Verifique se o JSON Server está rodando."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="home-page">
        <Header />

        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Carregando perfil...
        </div>
      </div>
    );
  }

  const nickname = email ? email.split("@")[0] : nome || "Usuário";
  const enderecoTexto = formatarEndereco(endereco);

  return (
    <div className="home-page">

      <Header />

      <main className="profile-container">

        <div className="profile-card">

          <div className="profile-avatar">
            <FiUser />
          </div>

          <h2 className="profile-nickname">{nickname}</h2>

          <div className="profile-info">

            <div className="profile-info-item">
              <FiMail />
              <span>{email}</span>
            </div>

            <div className="profile-info-item">
              <FiMapPin />
              <span>
                {enderecoTexto || "Nenhum endereço cadastrado"}
              </span>
            </div>

          </div>

          {!editando ? (

            <button className="profile-edit-button" onClick={abrirEdicao}>
              <FiEdit2 />
              Editar perfil
            </button>

          ) : (

            <form className="profile-edit-form" onSubmit={salvarEdicao}>

              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={alterarCampo}
                  placeholder="Digite seu e-mail"
                  required
                />
              </label>

              <div className="profile-address-title">Endereço</div>

              <div className="profile-double">

                <label>
                  CEP
                  <input
                    type="text"
                    name="cep"
                    value={form.cep}
                    onChange={alterarCampo}
                    placeholder="00000-000"
                    maxLength="9"
                  />
                </label>

                <label>
                  Estado
                  <input
                    type="text"
                    name="estado"
                    value={form.estado}
                    onChange={alterarCampo}
                    placeholder="UF"
                    maxLength="2"
                  />
                </label>

              </div>

              <label>
                Rua
                <input
                  type="text"
                  name="rua"
                  value={form.rua}
                  onChange={alterarCampo}
                  placeholder="Nome da rua"
                />
              </label>

              <div className="profile-double">

                <label>
                  Número
                  <input
                    type="text"
                    name="numero"
                    value={form.numero}
                    onChange={alterarCampo}
                    placeholder="Nº"
                  />
                </label>

                <label>
                  Complemento
                  <input
                    type="text"
                    name="complemento"
                    value={form.complemento}
                    onChange={alterarCampo}
                    placeholder="Apto, bloco..."
                  />
                </label>

              </div>

              <div className="profile-double">

                <label>
                  Bairro
                  <input
                    type="text"
                    name="bairro"
                    value={form.bairro}
                    onChange={alterarCampo}
                    placeholder="Bairro"
                  />
                </label>

                <label>
                  Cidade
                  <input
                    type="text"
                    name="cidade"
                    value={form.cidade}
                    onChange={alterarCampo}
                    placeholder="Cidade"
                  />
                </label>

              </div>

              {erro && <p className="profile-error">{erro}</p>}

              <div className="profile-edit-actions">

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  <FiX />
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={salvando}
                >
                  <FiCheck />
                  {salvando ? "Salvando..." : "Salvar"}
                </button>

              </div>

            </form>

          )}

          <p className="profile-note">
            Seu e-mail e endereço ficam salvos na sua conta e também são
            usados automaticamente no checkout.
          </p>

        </div>

      </main>

      <Footer />

    </div>
  );
}