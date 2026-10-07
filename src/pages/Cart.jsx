import "./cart.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FiShield, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { lerDadosUsuario, salvarDadosUsuario } from "../utils/storageUsuario";
import { obterEstoqueDisponivel } from "../utils/estoque";

export default function Cart() {
  const navigate = useNavigate();

  const [carrinho, setCarrinho] = useState([]);
  const [estoqueAtual, setEstoqueAtual] = useState({});

  const [cep, setCep] = useState("");

  async function sincronizarEstoque() {
    try {
      const resposta = await fetch("http://localhost:3000/produtos");

      if (!resposta.ok) {
        return;
      }

      const produtos = await resposta.json();
      const estoqueMapeado = Object.fromEntries(
        produtos.map((produto) => [
          String(produto.id),
          Number(produto.stock_quantity ?? produto.quantidade_estoque ?? 0),
        ]),
      );

      setEstoqueAtual(estoqueMapeado);

      setCarrinho((carrinhoAtual) =>
        carrinhoAtual
          .map((item) => {
            const estoqueDisponivel = Number(
              estoqueMapeado[String(item.id)] ?? item.quantidade,
            );

            if (estoqueDisponivel <= 0) {
              return null;
            }

            return {
              ...item,
              quantidade: Math.min(item.quantidade, estoqueDisponivel),
            };
          })
          .filter(Boolean),
      );
    } catch (error) {
      console.error("Erro ao sincronizar estoque do carrinho:", error);
    }
  }

  useEffect(() => {
    const produtos = lerDadosUsuario("carrinho");
    setCarrinho(produtos);
    sincronizarEstoque();

    const intervalo = setInterval(() => {
      sincronizarEstoque();
    }, 15000);

    return () => clearInterval(intervalo);
  }, []);

  function atualizarCarrinho(novoCarrinho) {
    setCarrinho(novoCarrinho);
    salvarDadosUsuario("carrinho", novoCarrinho);
  }

  function obterEstoqueDisponivelDoItem(itemId) {
    return Number(estoqueAtual[String(itemId)] ?? 0);
  }

  async function aumentarQuantidade(id) {
    const itemAtual = carrinho.find((item) => item.id === id);
    if (!itemAtual) return;

    const estoqueDisponivel = obterEstoqueDisponivelDoItem(id);
    const proximaQuantidade = itemAtual.quantidade + 1;

    if (estoqueDisponivel > 0 && proximaQuantidade > estoqueDisponivel) {
      alert(
        `Quantidade indisponível. Apenas ${estoqueDisponivel} unidade${
          estoqueDisponivel > 1 ? "s" : ""
        } restante${estoqueDisponivel > 1 ? "s" : ""}.`,
      );
      return;
    }

    const novoCarrinho = carrinho.map((item) =>
      item.id === id
        ? {
            ...item,
            quantidade: proximaQuantidade,
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

  function validarCarrinhoAntesDeProsseguir() {
    const itensSemEstoque = carrinho.filter((item) => {
      const estoqueDisponivel = obterEstoqueDisponivelDoItem(item.id);
      return estoqueDisponivel <= 0 || item.quantidade > estoqueDisponivel;
    });

    if (itensSemEstoque.length > 0) {
      const nomeProduto = itensSemEstoque[0]?.nome || "algum produto";
      alert(
        `Não foi possível continuar: "${nomeProduto}" não possui estoque suficiente no momento. Ajuste a quantidade ou remova o item.`,
      );
      return false;
    }

    return true;
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

              {carrinho.map((item) => {
                const estoqueDisponivel = obterEstoqueDisponivelDoItem(item.id);
                const excedeuEstoque = estoqueDisponivel > 0 && item.quantidade > estoqueDisponivel;

                return (
                  <div className="cart-product" key={item.id}>
                    <div className="cart-product-info">
                      <img src={item.imagem} alt={item.nome} />

                      <div>
                        <strong>{item.nome}</strong>

                        <span>
                          R$ {item.preco.toFixed(2).replace(".", ",")} por unidade
                        </span>

                        {estoqueDisponivel <= 0 ? (
                          <small style={{ color: "#d64679", display: "block" }}>
                            Produto indisponível no momento
                          </small>
                        ) : excedeuEstoque ? (
                          <small style={{ color: "#d64679", display: "block" }}>
                            Apenas {estoqueDisponivel} unidade{estoqueDisponivel > 1 ? "s" : ""} disponível{estoqueDisponivel > 1 ? "is" : ""}
                          </small>
                        ) : (
                          <small style={{ color: "#3aaf7f", display: "block" }}>
                            {estoqueDisponivel} unidades disponíveis
                          </small>
                        )}
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
                );
              })}
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

                <button
                  onClick={() => {
                    if (validarCarrinhoAntesDeProsseguir()) {
                      navigate("/identificacao");
                    }
                  }}
                >
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
