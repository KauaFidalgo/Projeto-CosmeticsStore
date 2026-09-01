import "./payment.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Payment() {
  const navigate = useNavigate();

  const [carrinho, setCarrinho] = useState([]);
  const [pagamento, setPagamento] = useState("");

  useEffect(() => {
    const produtos =
      JSON.parse(localStorage.getItem("carrinho")) || [];

    setCarrinho(produtos);
  }, []);

  const total = carrinho.reduce(
    (valor, item) => valor + item.preco * item.quantidade,
    0
  );

  const descontoPix = total * 0.15;

  const totalPix = total - descontoPix;

  function finalizarCompra() {
    if (!pagamento) {
      alert("Escolha uma forma de pagamento.");
      return;
    }

    if (pagamento === "pix") {
      alert("Compra finalizada! O código Pix será gerado.");
    } else if (pagamento === "credito") {
      alert("Compra finalizada no cartão de crédito!");
    } else if (pagamento === "debito") {
      alert("Compra finalizada no cartão de débito!");
    } else {
      alert("Boleto gerado com sucesso!");
    }
  }

  return (
    <div className="payment-page">

      {/* HEADER */}

      <header className="checkout-header">
        <button
          className="checkout-logo"
          onClick={() => navigate("/home")}
        >
          SC Medic
        </button>
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

        {/* ÁREA PRINCIPAL */}

        <div className="payment-main">

          {/* PAGAMENTO */}

          <section className="payment-options">

            <h2>Escolha a forma de pagamento</h2>

            <button
              className={
                pagamento === "pix"
                  ? "payment-option selected"
                  : "payment-option"
              }
              onClick={() => setPagamento("pix")}
            >
              Pix
            </button>

            <button
              className={
                pagamento === "credito"
                  ? "payment-option selected"
                  : "payment-option"
              }
              onClick={() => setPagamento("credito")}
            >
              Cartão de crédito
            </button>

            <button
              className={
                pagamento === "debito"
                  ? "payment-option selected"
                  : "payment-option"
              }
              onClick={() => setPagamento("debito")}
            >
              Cartão de débito
            </button>

            <button
              className={
                pagamento === "boleto"
                  ? "payment-option selected"
                  : "payment-option"
              }
              onClick={() => setPagamento("boleto")}
            >
              boleto
            </button>

          </section>

          {/* RESUMO */}

          <aside className="payment-summary">

            <h2>Resumo da compra</h2>

            <div className="summary-products">

              {carrinho.map((item) => (
                <div
                  className="summary-product"
                  key={item.id}
                >
                  <span>
                    {item.nome} x{item.quantidade}
                  </span>

                  <strong>
                    R${" "}
                    {(item.preco * item.quantidade)
                      .toFixed(2)
                      .replace(".", ",")}
                  </strong>
                </div>
              ))}

            </div>

            <div className="summary-line">
              <span>Produtos</span>

              <strong>
                R$ {total.toFixed(2).replace(".", ",")}
              </strong>
            </div>

            <div className="summary-line">
              <span>Frete</span>

              <strong className="pink">
                Grátis
              </strong>
            </div>

            {pagamento === "pix" && (
              <div className="summary-line">
                <span>Desconto Pix</span>

                <strong className="pink">
                  - R$ {descontoPix.toFixed(2).replace(".", ",")}
                </strong>
              </div>
            )}

            <div className="summary-total">
              <span>Total</span>

              <strong>
                R${" "}
                {(pagamento === "pix"
                  ? totalPix
                  : total
                )
                  .toFixed(2)
                  .replace(".", ",")}
              </strong>
            </div>

            <button
              className="finish-button"
              onClick={finalizarCompra}
            >
              Finalizar compra
            </button>

          </aside>

        </div>

      </main>
    </div>
  );
}