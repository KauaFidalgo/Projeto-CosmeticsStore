import "./payment.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FiZap,
  FiCreditCard,
  FiFileText,
  FiLock,
  FiShield,
  FiCopy,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
} from "react-icons/fi";
import { lerDadosUsuario, removerDadosUsuario } from "../utils/storageUsuario";

import { getUsuarioLogado } from "../utils/admin";
import { criarPedido } from "../services/pedidosService";

const CODIGO_PIX =
  "00020126580014BR.GOV.BCB.PIX0136scmedic-pagamentos5204000053039865802BR5908SC MEDIC6009SAO PAULO";

// AMBIENTE DE TESTE: salva o número completo do cartão no pedido.
// Use apenas números fictícios. Em produção, deixe como false.
// O CVV NUNCA é salvo.
const SALVAR_NUMERO_COMPLETO_TESTE = true;

// Vencimento do boleto em dias úteis (pula sábado e domingo)
function adicionarDiasUteis(dias) {
  const data = new Date();
  let adicionados = 0;

  while (adicionados < dias) {
    data.setDate(data.getDate() + 1);

    const diaSemana = data.getDay();

    if (diaSemana !== 0 && diaSemana !== 6) {
      adicionados++;
    }
  }

  return data.toISOString();
}

// Linha digitável fictícia (simulação)
function gerarLinhaDigitavel() {
  const digitos = (quantidade) =>
    Array.from({ length: quantidade }, () =>
      Math.floor(Math.random() * 10)
    ).join("");

  return `${digitos(5)}.${digitos(5)} ${digitos(5)}.${digitos(6)} ${digitos(5)}.${digitos(6)} ${digitos(1)} ${digitos(14)}`;
}

export default function Payment() {
  const navigate = useNavigate();

  const [carrinho, setCarrinho] = useState([]);
  const [pagamento, setPagamento] = useState("");

  // Cartão
  const [numeroCartao, setNumeroCartao] = useState("");
  const [nomeCartao, setNomeCartao] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [parcelas, setParcelas] = useState(1);

  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    const produtos = lerDadosUsuario("carrinho");
    setCarrinho(produtos);
  }, []);

  // Limpa erro ao trocar de método
  useEffect(() => {
    setErro("");
  }, [pagamento]);

  // =========================
  // VALORES
  // =========================

  const total = carrinho.reduce(
    (valor, item) => valor + item.preco * item.quantidade,
    0
  );

  const descontoPix = total * 0.15;
  const totalPix = total - descontoPix;

  const totalFinal = pagamento === "pix" ? totalPix : total;

  function formatarValor(valor) {
    return valor.toFixed(2).replace(".", ",");
  }

  // =========================
  // MÁSCARAS DO CARTÃO
  // =========================

  function alterarNumeroCartao(valor) {
    const somenteNumeros = valor.replace(/\D/g, "").slice(0, 16);
    const formatado = somenteNumeros.replace(/(\d{4})(?=\d)/g, "$1 ");
    setNumeroCartao(formatado);
  }

  function alterarValidade(valor) {
    let somenteNumeros = valor.replace(/\D/g, "").slice(0, 4);

    if (somenteNumeros.length > 2) {
      somenteNumeros =
        somenteNumeros.slice(0, 2) + "/" + somenteNumeros.slice(2);
    }

    setValidade(somenteNumeros);
  }

  function alterarCvv(valor) {
    setCvv(valor.replace(/\D/g, "").slice(0, 4));
  }

  function bandeiraCartao() {
    const numero = numeroCartao.replace(/\s/g, "");

    if (numero.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(numero)) return "Mastercard";
    if (/^3[47]/.test(numero)) return "Amex";
    if (numero.startsWith("6")) return "Elo";

    return "";
  }

  // =========================
  // VALIDAÇÃO
  // =========================

  function validarCartao() {
    const numero = numeroCartao.replace(/\s/g, "");

    if (numero.length < 16) {
      return "Número do cartão incompleto.";
    }

    if (nomeCartao.trim().length < 3) {
      return "Digite o nome como está impresso no cartão.";
    }

    const [mes, ano] = validade.split("/");

    if (!mes || !ano || Number(mes) < 1 || Number(mes) > 12) {
      return "Validade inválida. Use o formato MM/AA.";
    }

    const hoje = new Date();
    const anoAtual = hoje.getFullYear() % 100;
    const mesAtual = hoje.getMonth() + 1;

    if (
      Number(ano) < anoAtual ||
      (Number(ano) === anoAtual && Number(mes) < mesAtual)
    ) {
      return "Este cartão está vencido.";
    }

    if (cvv.length < 3) {
      return "CVV incompleto.";
    }

    return "";
  }

  // =========================
  // PIX — COPIAR CÓDIGO
  // =========================

  async function copiarCodigoPix() {
    try {
      await navigator.clipboard.writeText(CODIGO_PIX);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Não foi possível copiar o código. Copie manualmente.");
    }
  }

  // =========================
  // DETALHES DO PAGAMENTO (vai no pedido)
  // O CVV nunca é salvo
  // =========================

  function montarDetalhesPagamento() {
    if (pagamento === "credito" || pagamento === "debito") {
      const numeroLimpo = numeroCartao.replace(/\s/g, "");

      const detalhes = {
        tipo: pagamento,
        bandeira: bandeiraCartao() || "Não identificada",
        final: numeroLimpo.slice(-4),
        titular: nomeCartao.trim(),
        validade,
        parcelas: pagamento === "credito" ? parcelas : 1,
      };

      if (SALVAR_NUMERO_COMPLETO_TESTE) {
        detalhes.numero = numeroCartao;
      }

      return detalhes;
    }

    if (pagamento === "boleto") {
      return {
        tipo: "boleto",
        vencimento: adicionarDiasUteis(3),
        codigo: gerarLinhaDigitavel(),
      };
    }

    return {
      tipo: "pix",
      codigo: CODIGO_PIX,
      expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  // =========================
  // FINALIZAR
  // =========================

  async function finalizarCompra() {
    setErro("");

    if (!pagamento) {
      setErro("Escolha uma forma de pagamento para continuar.");
      return;
    }

    if (pagamento === "credito" || pagamento === "debito") {
      const erroCartao = validarCartao();

      if (erroCartao) {
        setErro(erroCartao);
        return;
      }
    }

    const usuario = getUsuarioLogado();

    if (!usuario) {
      setErro("Sua sessão expirou. Faça login novamente para finalizar.");
      return;
    }

    setProcessando(true);

    const ehPix = pagamento === "pix";

    // Endereço salvo no Profile (texto único), com fallback para campos separados
    let perfilInfo = {};

    try {
      perfilInfo = JSON.parse(localStorage.getItem("perfilInfo")) || {};
    } catch {
      perfilInfo = {};
    }

    const enderecoTexto =
      perfilInfo.endereco ||
      [
        usuario.rua &&
          `${usuario.rua}${usuario.numero ? `, ${usuario.numero}` : ""}`,
        usuario.bairro,
        usuario.cidade &&
          `${usuario.cidade}${usuario.estado ? `/${usuario.estado}` : ""}`,
        usuario.cep && `CEP ${usuario.cep}`,
      ]
        .filter(Boolean)
        .join(" • ");

    const novoPedido = {
      criadoEm: new Date().toISOString(),
      status: "novo",
      pagamento,
      parcelas: pagamento === "credito" ? parcelas : null,
      detalhesPagamento: montarDetalhesPagamento(),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
      },
      endereco: enderecoTexto,
      itens: carrinho.map((item) => ({
        id: item.id,
        nome: item.nome,
        categoria: item.categoria,
        imagem: item.imagem,
        descricao: item.descricao,
        preco: item.preco,
        precoAntigo: item.precoAntigo,
        quantidade: item.quantidade,
      })),
      subtotal: total,
      desconto: ehPix ? descontoPix : 0,
      total: totalFinal,
    };

    try {
      // Simula o processamento do pagamento e grava o pedido no banco
      const [pedidoCriado] = await Promise.all([
        criarPedido(novoPedido),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);

      setPedido({
        numero: String(pedidoCriado.id).slice(0, 6),
        metodo: pagamento,
        valor: totalFinal,
        itens: carrinho.length,
      });

      removerDadosUsuario("carrinho");
      localStorage.removeItem("carrinho");
    } catch (error) {
      console.error(error);

      setErro(
        "Não foi possível registrar o pedido. Verifique se o JSON Server está rodando."
      );
    } finally {
      setProcessando(false);
    }
  }

  const nomesMetodo = {
    pix: "Pix",
    credito: "Cartão de crédito",
    debito: "Cartão de débito",
    boleto: "Boleto bancário",
  };

  // =========================
  // PEDIDO CONFIRMADO
  // =========================

  if (pedido) {
    return (
      <div className="payment-page">
        <header className="checkout-header">
          <button className="checkout-logo" onClick={() => navigate("/home")}>
            SC Medic
          </button>
        </header>

        <main className="payment-success">
          <FiCheckCircle className="success-icon" />

          <h1>Pedido confirmado!</h1>

          <p>
            Seu pedido <strong>#{pedido.numero}</strong> foi realizado com
            sucesso. Você receberá os detalhes por e-mail em instantes.
          </p>

          <div className="success-details">
            <div>
              <span>Pagamento</span>
              <strong>{nomesMetodo[pedido.metodo]}</strong>
            </div>

            <div>
              <span>Itens</span>
              <strong>{pedido.itens}</strong>
            </div>

            <div>
              <span>Total</span>
              <strong>R$ {formatarValor(pedido.valor)}</strong>
            </div>
          </div>

          {pedido.metodo === "pix" && (
            <p className="success-note">
              O código Pix é válido por 30 minutos. Após o pagamento, a
              confirmação é imediata.
            </p>
          )}

          {pedido.metodo === "boleto" && (
            <p className="success-note">
              O boleto vence em 3 dias úteis. A confirmação pode levar até 2
              dias após o pagamento.
            </p>
          )}

          <button className="success-button" onClick={() => navigate("/home")}>
            Continuar comprando
          </button>
        </main>
      </div>
    );
  }

  // =========================
  // CARRINHO VAZIO
  // =========================

  if (carrinho.length === 0) {
    return (
      <div className="payment-page">
        <header className="checkout-header">
          <button className="checkout-logo" onClick={() => navigate("/home")}>
            SC Medic
          </button>
        </header>

        <main className="payment-success">
          <h1>Não há nada para pagar</h1>

          <p>Seu carrinho está vazio. Adicione produtos para continuar.</p>

          <button className="success-button" onClick={() => navigate("/home")}>
            Voltar para a loja
          </button>
        </main>
      </div>
    );
  }

  // =========================
  // CHECKOUT
  // =========================

  return (
    <div className="payment-page">
      <header className="checkout-header">
        <button className="checkout-logo" onClick={() => navigate("/home")}>
          SC Medic
        </button>

        <div className="secure-badge">
          <FiLock />
          Compra 100% segura
        </div>
      </header>

      <main className="payment-container">
        {/* ETAPAS */}

        <div className="checkout-steps">
          <div className="checkout-step completed">
            <span>1</span>
            Carrinho
          </div>

          <div className="checkout-step completed">
            <span>2</span>
            Identificação
          </div>

          <div className="checkout-step active">
            <span>3</span>
            Pagamento
          </div>
        </div>

        <div className="payment-main">
          {/* MÉTODOS DE PAGAMENTO */}

          <section className="payment-options">
            <h2>Como você prefere pagar?</h2>

            {/* PIX */}

            <div
              className={
                pagamento === "pix"
                  ? "payment-option selected"
                  : "payment-option"
              }
            >
              <button
                className="payment-option-header"
                onClick={() => setPagamento("pix")}
              >
                <span className="option-radio" />

                <FiZap className="option-icon" />

                <div className="option-text">
                  <strong>Pix</strong>
                  <small>Aprovação imediata</small>
                </div>

                <span className="option-badge">15% OFF</span>
              </button>

              {pagamento === "pix" && (
                <div className="payment-option-body">
                  <p>
                    Ao finalizar, o código Pix será gerado. Pague em até{" "}
                    <strong>30 minutos</strong> e ganhe{" "}
                    <strong>15% de desconto</strong> — você paga{" "}
                    <strong>R$ {formatarValor(totalPix)}</strong>.
                  </p>

                  <div className="pix-code">
                    <span>{CODIGO_PIX.slice(0, 38)}...</span>

                    <button onClick={copiarCodigoPix}>
                      {copiado ? <FiCheck /> : <FiCopy />}
                      {copiado ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CRÉDITO */}

            <div
              className={
                pagamento === "credito"
                  ? "payment-option selected"
                  : "payment-option"
              }
            >
              <button
                className="payment-option-header"
                onClick={() => setPagamento("credito")}
              >
                <span className="option-radio" />

                <FiCreditCard className="option-icon" />

                <div className="option-text">
                  <strong>Cartão de crédito</strong>
                  <small>Em até 10x sem juros</small>
                </div>
              </button>

              {pagamento === "credito" && (
                <div className="payment-option-body">
                  <div className="card-form">
                    <label className="field field-full">
                      <span>Número do cartão</span>

                      < div className="field-input">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={numeroCartao}
                          onChange={(e) => alterarNumeroCartao(e.target.value)}
                          placeholder="0000 0000 0000 0000"
                        />

                        {bandeiraCartao() && (
                          <em className="card-brand">{bandeiraCartao()}</em>
                        )}
                      </div>
                    </label>

                    <label className="field field-full">
                      <span>Nome impresso no cartão</span>

                      <input
                        type="text"
                        value={nomeCartao}
                        onChange={(e) =>
                          setNomeCartao(e.target.value.toUpperCase())
                        }
                        placeholder="COMO ESTÁ NO CARTÃO"
                      />
                    </label>

                    <label className="field">
                      <span>Validade</span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={validade}
                        onChange={(e) => alterarValidade(e.target.value)}
                        placeholder="MM/AA"
                      />
                    </label>

                    <label className="field">
                      <span>CVV</span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={cvv}
                        onChange={(e) => alterarCvv(e.target.value)}
                        placeholder="123"
                      />
                    </label>

                    <label className="field field-full">
                      <span>Parcelamento</span>

                      <select
                        value={parcelas}
                        onChange={(e) => setParcelas(Number(e.target.value))}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n}x de R$ {formatarValor(total / n)} sem juros
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* DÉBITO */}

            <div
              className={
                pagamento === "debito"
                  ? "payment-option selected"
                  : "payment-option"
              }
            >
              <button
                className="payment-option-header"
                onClick={() => setPagamento("debito")}
              >
                <span className="option-radio" />

                <FiCreditCard className="option-icon" />

                <div className="option-text">
                  <strong>Cartão de débito</strong>
                  <small>Débito imediato em conta</small>
                </div>
              </button>

              {pagamento === "debito" && (
                <div className="payment-option-body">
                  <div className="card-form">
                    <label className="field field-full">
                      <span>Número do cartão</span>

                      <div className="field-input">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={numeroCartao}
                          onChange={(e) => alterarNumeroCartao(e.target.value)}
                          placeholder="0000 0000 0000 0000"
                        />

                        {bandeiraCartao() && (
                          <em className="card-brand">{bandeiraCartao()}</em>
                        )}
                      </div>
                    </label>

                    <label className="field field-full">
                      <span>Nome impresso no cartão</span>

                      <input
                        type="text"
                        value={nomeCartao}
                        onChange={(e) =>
                          setNomeCartao(e.target.value.toUpperCase())
                        }
                        placeholder="COMO ESTÁ NO CARTÃO"
                      />
                    </label>

                    <label className="field">
                      <span>Validade</span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={validade}
                        onChange={(e) => alterarValidade(e.target.value)}
                        placeholder="MM/AA"
                      />
                    </label>

                    <label className="field">
                      <span>CVV</span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={cvv}
                        onChange={(e) => alterarCvv(e.target.value)}
                        placeholder="123"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* BOLETO */}

            <div
              className={
                pagamento === "boleto"
                  ? "payment-option selected"
                  : "payment-option"
              }
            >
              <button
                className="payment-option-header"
                onClick={() => setPagamento("boleto")}
              >
                <span className="option-radio" />

                <FiFileText className="option-icon" />

                <div className="option-text">
                  <strong>Boleto bancário</strong>
                  <small>Compensação em até 2 dias úteis</small>
                </div>
              </button>

              {pagamento === "boleto" && (
                <div className="payment-option-body">
                  <p>
                    O boleto será gerado após a finalização e vence em{" "}
                    <strong>3 dias úteis</strong>. O pedido é enviado somente
                    após a confirmação do pagamento.
                  </p>
                </div>
              )}
            </div>

            <button className="back-link" onClick={() => navigate("/carrinho")}>
              <FiChevronLeft />
              Voltar ao carrinho
            </button>
          </section>

          {/* RESUMO */}

          <aside className="payment-summary">
            <h2>Resumo da compra</h2>

            <div className="summary-products">
              {carrinho.map((item) => (
                <div className="summary-product" key={item.id}>
                  <span>
                    {item.nome} <em>x{item.quantidade}</em>
                  </span>

                  <strong>
                    R$ {formatarValor(item.preco * item.quantidade)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="summary-line">
              <span>Produtos</span>
              <strong>R$ {formatarValor(total)}</strong>
            </div>

            <div className="summary-line">
              <span>Frete</span>
              <strong className="pink">Grátis</strong>
            </div>

            {pagamento === "pix" && (
              <div className="summary-line">
                <span>Desconto Pix (15%)</span>
                <strong className="pink">
                  - R$ {formatarValor(descontoPix)}
                </strong>
              </div>
            )}

            <div className="summary-total">
              <span>Total</span>

              <div className="summary-total-value">
                <strong>R$ {formatarValor(totalFinal)}</strong>

                {pagamento === "credito" && parcelas > 1 && (
                  <small>
                    {parcelas}x de R$ {formatarValor(total / parcelas)} sem
                    juros
                  </small>
                )}
              </div>
            </div>

            {erro && <div className="payment-error">{erro}</div>}

            <button
              className="finish-button"
              onClick={finalizarCompra}
              disabled={processando}
            >
              {processando ? "Processando..." : "Finalizar compra"}
            </button>

            <div className="summary-security">
              <FiShield />
              Seus dados são protegidos com criptografia de ponta a ponta.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}