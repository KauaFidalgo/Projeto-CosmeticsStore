import "./payment.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

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
  FiLoader,
} from "react-icons/fi";
import { lerDadosUsuario, removerDadosUsuario } from "../utils/storageUsuario";

import { getUsuarioLogado } from "../utils/admin";
import { criarPedido, validarEstoque } from "../services/pedidosService";

const CODIGO_PIX =
  "00020126580014BR.GOV.BCB.PIX0136scmedic-pagamentos5204000053039865802BR5908SC MEDIC6009SAO PAULO";

function luhnCheck(numero) {
  const digits = (numero || "").replace(/\D/g, "");

  if (digits.length < 13 || digits.length > 19) return false;

  let soma = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    soma += digit;
    shouldDouble = !shouldDouble;
  }

  return soma % 10 === 0;
}

function formatarValor(valor) {
  return Number(valor || 0)
    .toFixed(2)
    .replace(".", ",");
}

function adicionarDiasUteis(dias) {
  const data = new Date();
  let adicionados = 0;

  while (adicionados < dias) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) adicionados += 1;
  }

  return data.toISOString();
}

function gerarLinhaDigitavel() {
  const digitos = (quantidade) =>
    Array.from({ length: quantidade }, () => Math.floor(Math.random() * 10)).join("");

  return `${digitos(5)}.${digitos(5)} ${digitos(5)}.${digitos(6)} ${digitos(5)}.${digitos(6)} ${digitos(1)} ${digitos(14)}`;
}

function getCardBrand(numero) {
  const digits = numero.replace(/\s/g, "");

  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^(636368|438935|504175|451416|509048|627780|636297)/.test(digits)) return "Elo";

  return "";
}

function maskCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function maskExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function tokenizeCard(numero) {
  const digits = numero.replace(/\D/g, "");
  return `tok_${digits.slice(-6)}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export default function Payment() {
  const navigate = useNavigate();

  const [carrinho, setCarrinho] = useState([]);
  const [pagamento, setPagamento] = useState("credito");
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
    const produtos = lerDadosUsuario("carrinho") || [];
    setCarrinho(produtos);
  }, []);

  useEffect(() => {
    setErro("");
  }, [pagamento]);

  const total = useMemo(
    () => carrinho.reduce((valor, item) => valor + Number(item.preco || 0) * Number(item.quantidade || 1), 0),
    [carrinho],
  );

  const descontoPix = total * 0.15;
  const totalPix = total - descontoPix;
  const totalFinal = pagamento === "pix" ? totalPix : total;
  const bandeira = getCardBrand(numeroCartao);

  const cardPreview = {
    brand: bandeira || "Cartão",
    numero: numeroCartao ? numeroCartao.padEnd(19, " • ").slice(0, 19) : "•••• •••• •••• ••••",
    nome: nomeCartao ? nomeCartao.toUpperCase() : "SEU NOME",
    validade: validade || "MM/AA",
  };

  function validarCartao() {
    const numero = numeroCartao.replace(/\s/g, "");
    if (numero.length < 16) return "Número do cartão incompleto.";
    if (!luhnCheck(numero)) return "Número do cartão inválido.";
    if (nomeCartao.trim().length < 3) return "Digite o nome como está impresso no cartão.";
    if (!/^\d{2}\/\d{2}$/.test(validade)) return "Validade inválida. Use o formato MM/AA.";

    const [mes, ano] = validade.split("/");
    if (Number(mes) < 1 || Number(mes) > 12) return "Mês da validade inválido.";

    const hoje = new Date();
    const anoAtual = hoje.getFullYear() % 100;
    const mesAtual = hoje.getMonth() + 1;
    if (Number(ano) < anoAtual || (Number(ano) === anoAtual && Number(mes) < mesAtual)) {
      return "Este cartão está vencido.";
    }

    if (cvv.length < 3) return "Código de segurança inválido.";

    return "";
  }

  async function copiarCodigoPix() {
    try {
      await navigator.clipboard.writeText(CODIGO_PIX);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Não foi possível copiar o código. Copie manualmente.");
    }
  }

  function montarDetalhesPagamento() {
    if (pagamento === "credito" || pagamento === "debito") {
      const numeroLimpo = numeroCartao.replace(/\s/g, "");
      const brand = getCardBrand(numeroLimpo) || "Não identificada";

      return {
        tipo: pagamento,
        bandeira: brand,
        final: numeroLimpo.slice(-4),
        last4: numeroLimpo.slice(-4),
        titular: nomeCartao.trim(),
        validade,
        token: tokenizeCard(numeroLimpo),
        parcelas: pagamento === "credito" ? parcelas : 1,
      };
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

    for (const item of carrinho) {
      const temEstoque = await validarEstoque(item.id, item.quantidade);
      if (!temEstoque) {
        setErro(`Desculpe, não há estoque suficiente para "${item.nome}".`);
        return;
      }
    }

    setProcessando(true);

    const perfilInfo = JSON.parse(localStorage.getItem("perfilInfo") || "{}") || {};
    const enderecoTexto =
      perfilInfo.endereco ||
      [
        usuario.rua && `${usuario.rua}${usuario.numero ? `, ${usuario.numero}` : ""}`,
        usuario.bairro,
        usuario.cidade && `${usuario.cidade}${usuario.estado ? `/${usuario.estado}` : ""}`,
        usuario.cep && `CEP ${usuario.cep}`,
      ]
        .filter(Boolean)
        .join(" • ");

    const novoPedido = {
      criadoEm: new Date().toISOString(),
      status: "em separacao",
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
      desconto: pagamento === "pix" ? descontoPix : 0,
      total: totalFinal,
    };

    try {
      const [pedidoCriado] = await Promise.all([
        criarPedido(novoPedido),
        new Promise((resolve) => setTimeout(resolve, 1600)),
      ]);

      const numeroPedido = `#ORD-${String(pedidoCriado.id).slice(-4).toUpperCase()}`;
      setPedido({
        numero: numeroPedido,
        metodo: pagamento,
        valor: totalFinal,
        itens: carrinho.length,
        endereco: enderecoTexto,
        finalCartao: numeroCartao.replace(/\s/g, "").slice(-4),
      });

      removerDadosUsuario("carrinho");
      localStorage.removeItem("carrinho");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível registrar o pedido. Verifique se o servidor está ativo.");
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

  if (pedido) {
    return (
      <div className="payment-page">
        <header className="checkout-header">
          <button className="checkout-logo" onClick={() => navigate("/home")}>
            SC Medic
          </button>
        </header>

        <main className="payment-success">
          <div className="success-badge">
            <FiCheckCircle />
          </div>

          <span className="success-eyebrow">PEDIDO ENVIADO</span>
          <h1>Pedido Concluído com Sucesso!</h1>
          <p className="success-subtitle">
            Seu pedido foi registrado e enviado para a nossa equipe de suporte.
            Você pode acompanhar todas as etapas no seu painel.
          </p>

          <section className="success-summary">
            <div>
              <span>Número do pedido</span>
              <strong>{pedido.numero}</strong>
            </div>
            <div>
              <span>Valor total</span>
              <strong>R$ {formatarValor(pedido.valor)}</strong>
            </div>
            <div>
              <span>Método de pagamento</span>
              <strong>
                {pedido.metodo === "credito" || pedido.metodo === "debito"
                  ? `${nomesMetodo[pedido.metodo]} • **** ${pedido.finalCartao}`
                  : nomesMetodo[pedido.metodo]}
              </strong>
            </div>
            <div>
              <span>Endereço de entrega</span>
              <strong>{pedido.endereco || "Endereço salvo no perfil"}</strong>
            </div>
          </section>

          <div className="success-actions">
            <button className="success-button primary" onClick={() => navigate("/meus-pedidos")}>
              Acompanhar em Meus Pedidos
            </button>
            <button className="success-button secondary" onClick={() => navigate("/home")}>
              Voltar para a Loja
            </button>
          </div>
        </main>
      </div>
    );
  }

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
          <button className="success-button primary" onClick={() => navigate("/home")}>
            Voltar para a loja
          </button>
        </main>
      </div>
    );
  }

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
          <section className="payment-options">
            <h2>Como você prefere pagar?</h2>

            <div className={pagamento === "pix" ? "payment-option selected" : "payment-option"}>
              <button className="payment-option-header" onClick={() => setPagamento("pix")}>
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
                    Ao finalizar, o código Pix será gerado. Pague em até <strong>30 minutos</strong> e ganhe
                    <strong> 15% de desconto</strong> — você paga <strong>R$ {formatarValor(totalPix)}</strong>.
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

            <div className={pagamento === "credito" ? "payment-option selected" : "payment-option"}>
              <button className="payment-option-header" onClick={() => setPagamento("credito")}>
                <span className="option-radio" />
                <FiCreditCard className="option-icon" />
                <div className="option-text">
                  <strong>Cartão de crédito</strong>
                  <small>Em até 10x sem juros</small>
                </div>
              </button>

              {pagamento === "credito" && (
                <div className="payment-option-body">
                  <div className="card-visual" aria-label="Pré-visualização do cartão">
                    <div className="card-chip" />
                    <div className="card-brand-pill">{cardPreview.brand || "Cartão"}</div>
                    <strong>{cardPreview.numero}</strong>
                    <div className="card-bottom">
                      <span>{cardPreview.nome}</span>
                      <em>{cardPreview.validade}</em>
                    </div>
                  </div>

                  <div className="card-form">
                    <label className="field field-full">
                      <span>Número do cartão</span>
                      <div className="field-input">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={numeroCartao}
                          onChange={(e) => setNumeroCartao(maskCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                        />
                        {bandeira && <em className="card-brand">{bandeira}</em>}
                      </div>
                    </label>

                    <label className="field field-full">
                      <span>Nome impresso no cartão</span>
                      <input
                        type="text"
                        value={nomeCartao}
                        onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
                        placeholder="COMO ESTÁ NO CARTÃO"
                      />
                    </label>

                    <label className="field">
                      <span>Validade</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={validade}
                        onChange={(e) => setValidade(maskExpiry(e.target.value))}
                        placeholder="MM/AA"
                      />
                    </label>

                    <label className="field">
                      <span>CVV</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123"
                      />
                    </label>

                    <label className="field field-full">
                      <span>Parcelamento</span>
                      <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}x de R$ {formatarValor(total / n)} sem juros
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className={pagamento === "debito" ? "payment-option selected" : "payment-option"}>
              <button className="payment-option-header" onClick={() => setPagamento("debito")}>
                <span className="option-radio" />
                <FiCreditCard className="option-icon" />
                <div className="option-text">
                  <strong>Cartão de débito</strong>
                  <small>Débito imediato em conta</small>
                </div>
              </button>

              {pagamento === "debito" && (
                <div className="payment-option-body">
                  <div className="card-visual" aria-label="Pré-visualização do cartão">
                    <div className="card-chip" />
                    <div className="card-brand-pill">{cardPreview.brand || "Cartão"}</div>
                    <strong>{cardPreview.numero}</strong>
                    <div className="card-bottom">
                      <span>{cardPreview.nome}</span>
                      <em>{cardPreview.validade}</em>
                    </div>
                  </div>

                  <div className="card-form">
                    <label className="field field-full">
                      <span>Número do cartão</span>
                      <div className="field-input">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={numeroCartao}
                          onChange={(e) => setNumeroCartao(maskCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                        />
                        {bandeira && <em className="card-brand">{bandeira}</em>}
                      </div>
                    </label>

                    <label className="field field-full">
                      <span>Nome impresso no cartão</span>
                      <input
                        type="text"
                        value={nomeCartao}
                        onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
                        placeholder="COMO ESTÁ NO CARTÃO"
                      />
                    </label>

                    <label className="field">
                      <span>Validade</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={validade}
                        onChange={(e) => setValidade(maskExpiry(e.target.value))}
                        placeholder="MM/AA"
                      />
                    </label>

                    <label className="field">
                      <span>CVV</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="123"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className={pagamento === "boleto" ? "payment-option selected" : "payment-option"}>
              <button className="payment-option-header" onClick={() => setPagamento("boleto")}>
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
                    O boleto será gerado após a finalização e vence em <strong>3 dias úteis</strong>. O pedido é
                    enviado somente após a confirmação do pagamento.
                  </p>
                </div>
              )}
            </div>

            <button className="back-link" onClick={() => navigate("/carrinho")}>
              <FiChevronLeft />
              Voltar ao carrinho
            </button>
          </section>

          <aside className="payment-summary">
            <h2>Resumo da compra</h2>

            <div className="summary-products">
              {carrinho.map((item) => (
                <div className="summary-product" key={item.id}>
                  <span>
                    {item.nome} <em>x{item.quantidade}</em>
                  </span>
                  <strong>R$ {formatarValor(item.preco * item.quantidade)}</strong>
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
                <strong className="pink">- R$ {formatarValor(descontoPix)}</strong>
              </div>
            )}

            <div className="summary-total">
              <span>Total</span>
              <div className="summary-total-value">
                <strong>R$ {formatarValor(totalFinal)}</strong>
                {pagamento === "credito" && parcelas > 1 && (
                  <small>
                    {parcelas}x de R$ {formatarValor(total / parcelas)} sem juros
                  </small>
                )}
              </div>
            </div>

            {erro && <div className="payment-error">{erro}</div>}

            <button className="finish-button" onClick={finalizarCompra} disabled={processando}>
              {processando ? (
                <>
                  <FiLoader className="button-spinner" />
                  Processando Pagamento...
                </>
              ) : (
                "Finalizar compra"
              )}
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