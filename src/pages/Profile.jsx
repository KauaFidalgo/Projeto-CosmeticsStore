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

export default function Profile() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState({ email: "", endereco: "" });
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ email: "", endereco: "" });

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const usuarioConvertido = JSON.parse(usuarioSalvo);

      setUsuario(usuarioConvertido);

      const perfilSalvo = localStorage.getItem("perfilInfo");
      const perfilConvertido = perfilSalvo ? JSON.parse(perfilSalvo) : {};

      const perfilAtual = {
        email: perfilConvertido.email || usuarioConvertido.email,
        endereco: perfilConvertido.endereco || "",
      };

      setPerfil(perfilAtual);
      setForm(perfilAtual);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      navigate("/", { replace: true });
    }
  }, [navigate]);

  function alterarCampo(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function abrirEdicao() {
    setForm(perfil);
    setEditando(true);
  }

  function cancelarEdicao() {
    setForm(perfil);
    setEditando(false);
  }

  function salvarEdicao(e) {
    e.preventDefault();

    if (!form.email.trim()) {
      alert("Informe um e-mail válido.");
      return;
    }

    const perfilAtualizado = {
      email: form.email.trim().toLowerCase(),
      endereco: form.endereco.trim(),
    };

    localStorage.setItem("perfilInfo", JSON.stringify(perfilAtualizado));

    setPerfil(perfilAtualizado);
    setEditando(false);
  }

  if (!usuario) {
    return null;
  }

  const nickname = perfil.email ? perfil.email.split("@")[0] : "Usuário";

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
              <span>{perfil.email}</span>
            </div>

            <div className="profile-info-item">
              <FiMapPin />
              <span>
                {perfil.endereco || "Nenhum endereço cadastrado"}
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

              <label>
                Endereço
                <input
                  type="text"
                  name="endereco"
                  value={form.endereco}
                  onChange={alterarCampo}
                  placeholder="Rua, número, bairro, cidade"
                />
              </label>

              <div className="profile-edit-actions">

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={cancelarEdicao}
                >
                  <FiX />
                  Cancelar
                </button>

                <button type="submit" className="profile-save-button">
                  <FiCheck />
                  Salvar
                </button>

              </div>

            </form>

          )}

          <p className="profile-note">
            Seus dados de cadastro continuam os mesmos. As alterações
            aqui afetam apenas as informações exibidas no seu perfil.
          </p>

        </div>

      </main>

      <Footer />

    </div>
  );
}