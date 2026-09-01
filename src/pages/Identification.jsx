import "./identification.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Identification() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cpf: "",
    nascimento: "",
    email: "",
    confirmarEmail: "",
    telefone: "",
  });

  function alterarCampo(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

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

    localStorage.setItem("identificacao", JSON.stringify(form));

    navigate("/pagamento");
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