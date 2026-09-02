import "./identification.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { FiEdit2, FiCheck, FiMapPin } from "react-icons/fi";

import {
  enderecoVazio,
  enderecoValido,
  formatarEndereco,
} from "../utils/endereco";

export default function Identification() {
  const navigate = useNavigate();

  const [usuarioId, setUsuarioId] = useState(null);

  const [form, setForm] = useState({
    cpf: "",
    nascimento: "",
    email: "",
    confirmarEmail: "",
    telefone: "",
  });

  const [endereco, setEndereco] = useState(enderecoVazio);
  const [enderecoForm, setEnderecoForm] = useState(enderecoVazio);

  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [enderecoConfirmado, setEnderecoConfirmado] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [erroEndereco, setErroEndereco] = useState("");

  // =========================
  // CARREGAR USUÁRIO E ENDEREÇO
  // =========================

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) {
      alert("Faça login para continuar com a compra.");
      navigate("/", { replace: true });
      return;
    }

    let usuarioLocal;

    try {
      usuarioLocal = JSON.parse(usuarioSalvo);
    } catch (error) {
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

        setUsuarioId(dados.id);

        setForm((atual) => ({
          ...atual,
          email: dados.email || "",
          confirmarEmail: dados.email || "",
        }));

        const enderecoAtual = {
          ...enderecoVazio,
          ...(dados.endereco || {}),
        };

        setEndereco(enderecoAtual);
        setEnderecoForm(enderecoAtual);

        if (!enderecoValido(enderecoAtual)) {
          setEditandoEndereco(true);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        setUsuarioId(usuarioLocal.id);
        setEditandoEndereco(true);
      } finally {
        setCarregando(false);
      }
    }

    carregarUsuario();
  }, [navigate]);

  function alterarCampo(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function alterarCampoEndereco(e) {
    setEnderecoForm({ ...enderecoForm, [e.target.name]: e.target.value });
  }

  // =========================
  // CONFIRMAR ENDEREÇO ATUAL
  // =========================

  function confirmarEnderecoAtual() {
    setEnderecoConfirmado(true);
  }

  // =========================
  // EDITAR ENDEREÇO
  // =========================

  function abrirEdicaoEndereco() {
    setEnderecoForm(endereco);
    setErroEndereco("");
    setEditandoEndereco(true);
    setEnderecoConfirmado(false);
  }

  function cancelarEdicaoEndereco() {
    if (!enderecoValido(endereco)) {
      return;
    }

    setEnderecoForm(endereco);
    setErroEndereco("");
    setEditandoEndereco(false);
  }

  async function salvarEndereco(e) {
    e.preventDefault();
    setErroEndereco("");

    const enderecoAtualizado = {
      cep: enderecoForm.cep.trim(),
      rua: enderecoForm.rua.trim(),
      numero: enderecoForm.numero.trim(),
      complemento: enderecoForm.complemento.trim(),
      bairro: enderecoForm.bairro.trim(),
      cidade: enderecoForm.cidade.trim(),
      estado: enderecoForm.estado.trim(),
    };

    if (!enderecoValido(enderecoAtualizado)) {
      setErroEndereco("Preencha CEP, rua, número, bairro, cidade e estado.");
      return;
    }

    setSalvandoEndereco(true);

    try {
      // O endereço confirmado/alterado no checkout substitui o
      // endereço salvo no perfil do usuário (mesma fonte de dados).
      const resposta = await fetch(
        `http://localhost:3000/usuarios/${usuarioId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endereco: enderecoAtualizado }),
        }
      );

      if (!resposta.ok) {
        throw new Error("Erro ao salvar endereço.");
      }

      const usuarioAtualizado = await resposta.json();

      setEndereco(enderecoAtualizado);
      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify(usuarioAtualizado)
      );

      setEditandoEndereco(false);
      setEnderecoConfirmado(true);
    } catch (error) {
      console.error(error);
      setErroEndereco(
        "Não foi possível salvar o endereço. Verifique se o JSON Server está rodando."
      );
    } finally {
      setSalvandoEndereco(false);
    }
  }

  // =========================
  // CONTINUAR PARA PAGAMENTO
  // =========================

  function continuar(e) {
    e.preventDefault();

    if (
      !form.cpf ||
      !form.nascimento ||
      !form.email ||
      !form.confirmarEmail ||
      !form.telefone
    ) {
      alert("Preencha todos os campos.");
      return;
    }

    if (form.email !== form.confirmarEmail) {
      alert("Os e-mails não são iguais.");
      return;
    }

    if (!enderecoValido(endereco) || !enderecoConfirmado) {
      alert("Confirme seu endereço de entrega antes de continuar.");
      return;
    }

    localStorage.setItem(
      "identificacao",
      JSON.stringify({ ...form, endereco })
    );

    navigate("/pagamento");
  }

  if (carregando) {
    return (
      <div className="identification-page">
        <header className="checkout-header">
          <button className="checkout-logo" onClick={() => navigate("/home")}>
            SC Medic
          </button>
        </header>

        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
          }}
        >
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="identification-page">

      {/* HEADER */}

      <header className="checkout-header">
        <button
          className="checkout-logo"
          onClick={() => navigate("/home")}
        >
          SC Medic
        </button>
      </header>

      <main className="checkout-container">

        {/* ETAPAS */}

        <div className="checkout-steps">

          <div className="checkout-step completed">
            <span>1</span>
            Carrinho
          </div>

          <div className="checkout-step active">
            <span>2</span>
            Identificação
          </div>

          <div className="checkout-step">
            <span>3</span>
            Pagamento
          </div>

        </div>

        {/* CONTEÚDO */}

        <section className="identification-content">

          <h2>Dados pessoais</h2>

          <form onSubmit={continuar}>

            <label>
              Informe seu CPF *
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={alterarCampo}
                placeholder="000.000.000-00"
                maxLength="14"
              />
            </label>

            <label>
              Data de nascimento *
              <input
                type="date"
                name="nascimento"
                value={form.nascimento}
                onChange={alterarCampo}
              />
            </label>

            <label>
              E-mail *
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={alterarCampo}
                placeholder="seuemail@email.com"
              />
            </label>

            <label>
              Confirme o e-mail
              <input
                type="email"
                name="confirmarEmail"
                value={form.confirmarEmail}
                onChange={alterarCampo}
                placeholder="Confirme seu e-mail"
              />
            </label>

            <label>
              Telefone *
              <input
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={alterarCampo}
                placeholder="(00) 00000-0000"
              />
            </label>

            {/* ================= ENDEREÇO DE ENTREGA ================= */}

            <div className="address-block">

              <h3 className="address-title">
                <FiMapPin />
                Endereço de entrega
              </h3>

              {!editandoEndereco ? (

                <div
                  className={
                    enderecoConfirmado
                      ? "address-card confirmed"
                      : "address-card"
                  }
                >
                  <p>{formatarEndereco(endereco)}</p>

                  {endereco.complemento && (
                    <span className="address-complemento">
                      {endereco.complemento}
                    </span>
                  )}

                  <span className="address-cep">CEP: {endereco.cep}</span>

                  <div className="address-actions">

                    <button
                      type="button"
                      className="address-edit-button"
                      onClick={abrirEdicaoEndereco}
                    >
                      <FiEdit2 />
                      Alterar endereço
                    </button>

                    <button
                      type="button"
                      className={
                        enderecoConfirmado
                          ? "address-confirm-button confirmed"
                          : "address-confirm-button"
                      }
                      onClick={confirmarEnderecoAtual}
                    >
                      <FiCheck />
                      {enderecoConfirmado
                        ? "Endereço confirmado"
                        : "Confirmar este endereço"}
                    </button>

                  </div>
                </div>

              ) : (

                <div className="address-edit-form">

                  <div className="identification-double">

                    <label>
                      CEP
                      <input
                        type="text"
                        name="cep"
                        value={enderecoForm.cep}
                        onChange={alterarCampoEndereco}
                        placeholder="00000-000"
                        maxLength="9"
                      />
                    </label>

                    <label>
                      Estado
                      <input
                        type="text"
                        name="estado"
                        value={enderecoForm.estado}
                        onChange={alterarCampoEndereco}
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
                      value={enderecoForm.rua}
                      onChange={alterarCampoEndereco}
                      placeholder="Nome da rua"
                    />
                  </label>

                  <div className="identification-double">

                    <label>
                      Número
                      <input
                        type="text"
                        name="numero"
                        value={enderecoForm.numero}
                        onChange={alterarCampoEndereco}
                        placeholder="Nº"
                      />
                    </label>

                    <label>
                      Complemento
                      <input
                        type="text"
                        name="complemento"
                        value={enderecoForm.complemento}
                        onChange={alterarCampoEndereco}
                        placeholder="Apto, bloco..."
                      />
                    </label>

                  </div>

                  <div className="identification-double">

                    <label>
                      Bairro
                      <input
                        type="text"
                        name="bairro"
                        value={enderecoForm.bairro}
                        onChange={alterarCampoEndereco}
                        placeholder="Bairro"
                      />
                    </label>

                    <label>
                      Cidade
                      <input
                        type="text"
                        name="cidade"
                        value={enderecoForm.cidade}
                        onChange={alterarCampoEndereco}
                        placeholder="Cidade"
                      />
                    </label>

                  </div>

                  {erroEndereco && (
                    <p className="address-error">{erroEndereco}</p>
                  )}

                  <div className="address-actions">

                    {enderecoValido(endereco) && (
                      <button
                        type="button"
                        className="address-edit-button"
                        onClick={cancelarEdicaoEndereco}
                        disabled={salvandoEndereco}
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      type="button"
                      className="address-confirm-button"
                      onClick={salvarEndereco}
                      disabled={salvandoEndereco}
                    >
                      <FiCheck />
                      {salvandoEndereco
                        ? "Salvando..."
                        : "Salvar e confirmar endereço"}
                    </button>

                  </div>
                </div>

              )}

            </div>

            <button
              type="submit"
              className="identification-button"
            >
              Continuar
            </button>

          </form>

        </section>

      </main>
    </div>
  );
}