import "./cart.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FiShield, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { lerDadosUsuario, salvarDadosUsuario } from "../utils/storageUsuario";

export default function Cart() {
  const navigate = useNavigate();

  const [carrinho, setCarrinho] = useState([]);

  const [cep, setCep] = useState("");

  useEffect(() => {
    const produtos = lerDadosUsuario("carrinho");
    setCarrinho(produtos);
  }, []);

  function atualizarCarrinho(novoCarrinho) {
    setCarrinho(novoCarrinho);

    salvarDadosUsuario("carrinho", novoCarrinho);
  }

  function aumentarQuantidade(id) {
    const novoCarrinho = carrinho.map((item) =>
      item.id === id
        ? {
            ...item,
            quantidade: item.quantidade + 1,
          }
        : item,
    );

    atualizarCarrinho(novoCarrinho);
  }

  function diminuirQuantidade(id) {
    const novoCarrinho = carrinho
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantidade: item.quantidade - 1,
            }
          : item,
      )
      .filter((item) => item.quantidade > 0);

    atualizarCarrinho(novoCarrinho);
  }

  function removerProduto(id) {
    const novoCarrinho = carrinho.filter((item) => item.id !== id);

    atualizarCarrinho(novoCarrinho);
  }

  function limparSacola() {
    atualizarCarrinho([]);
  }

  const total = carrinho.reduce(
    (valor, item) => valor + item.preco * item.quantidade,
    0,
  );

  const desconto = total * 0.15;

  return (
    <div className="cart-page">
      {/* HEADER */}

      <header className="checkout-header">
        <button className="checkout-logo" onClick={() => navigate("/home")}>
          SC Medic
        </button>

        <span className="secure-badge">
          <FiShield /> Compra segura
        </span>
      </header>

      <main className="cart-container">
        {/* ETAPAS */}

        <div className="checkout-steps">
          <div className="checkout-step active">
            <span>1</span>
            Sacola
          </div>

          <div className="checkout-step">
            <span>2</span>
            Identificação
          </div>

          <div className="checkout-step">
            <span>3</span>
            Pagamento
          </div>
        </div>

        {carrinho.length === 0 ? (
          /* =========================
                       CARRINHO VAZIO
                    ========================= */

          <section className="empty-cart">
            <div className="empty-cart-icon">
              <FiShoppingBag />
            </div>
            <h1>Seu carrinho está vazio</h1>

            <p>
              Navegue pelas categorias da loja ou faça uma busca pelo seu
              produto.
            </p>

            <button onClick={() => navigate("/home")}>
              Voltar Para o site
            </button>

            <div className="also-buy">
              <h2>Aproveita também</h2>

              <div className="recommendations">
                {[1, 2, 3].map((item) => (
                  <div className="recommendation" key={item}>
                    <div className="recommendation-image">
                      <img src="/images/restylane.png" alt="Restylane Vital" />
                    </div>

                    <strong>Restylane Vital</strong>

                    <div className="recommendation-rating">★★★★★ 4.8</div>

                    <small>R$ 390,00</small>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          /* =========================
                       CARRINHO COM PRODUTO
                    ========================= */

          <section className="filled-cart">
            <div className="cart-warning">
              <span>
                Os produtos na sacola não estão reservados. Finalize seu pedido
                antes que o estoque acabe.
              </span>
              <button type="button" onClick={limparSacola}>
                Limpar sacola
              </button>
            </div>

            <div className="cart-products">
              <div className="cart-section-heading">
                <div>
                  <span>SUA SACOLA</span>
                  <h1>Itens selecionados</h1>
                </div>
                <button type="button" onClick={limparSacola}>
                  Limpar sacola
                </button>
              </div>

              <div className="cart-products-title" aria-hidden="true">
                <strong>Produto</strong>

                <strong>Quantidade</strong>

                <strong>Valor total</strong>
              </div>

              {carrinho.map((item) => (
                <div className="cart-product" key={item.id}>
                  <div className="cart-product-info">
                    <img src={item.imagem} alt={item.nome} />

                    <div>
                      <strong>{item.nome}</strong>

                      <span>R$ {item.preco.toFixed(2).replace(".", ",")} por unidade</span>
                    </div>
                  </div>

                  <div className="quantity-control">
                    <button onClick={() => diminuirQuantidade(item.id)}>
                      -
                    </button>

                    <span>{item.quantidade}</span>

                    <button onClick={() => aumentarQuantidade(item.id)}>
                      +
                    </button>
                  </div>

                  <div className="cart-product-total">
                    <strong>
                      R${" "}
                      {(item.preco * item.quantidade)
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>

                    <small>
                      R$ {item.precoAntigo.toFixed(2).replace(".", ",")} no
                      Cartão
                    </small>
                  </div>

                  <button
                    className="delete-product"
                    onClick={() => removerProduto(item.id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            {/* PARTE INFERIOR */}

            <div className="cart-bottom">
              <div className="delivery">
                <h3>Prazo de entrega</h3>

                <div className="delivery-input">
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    maxLength="9"
                  />

                  <button>Calcular</button>
                </div>
              </div>

              <div className="cart-summary">
                <h3>Resumo da compra</h3>

                <div>
                  <span>Valor dos produtos</span>

                  <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
                </div>

                <div>
                  <span>Desconto Pix</span>

                  <strong className="pink">
                    R$ {desconto.toFixed(2).replace(".", ",")}
                  </strong>
                </div>

                <div>
                  <span>Frete</span>

                  <strong className="pink">Grátis</strong>
                </div>

                <div className="cart-summary-total">
                  <span>Total</span>
                  <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
                </div>

                <button onClick={() => navigate("/identificacao")}>
                  Continuar para identificação
                </button>

                <p className="cart-summary-security">
                  <FiShield /> Ambiente seguro e dados protegidos.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
