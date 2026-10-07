import "./home.css";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Header from "../components/Header";
import { FiHeart } from "react-icons/fi";
import { lerDadosUsuario, salvarDadosUsuario } from "../utils/storageUsuario";
import { obterStatusEstoque } from "../utils/estoque";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [busca, setBusca] = useState(searchParams.get("busca") || "");
  const [filtro, setFiltro] = useState(
    searchParams.get("categoria") || "todos"
  );
  const [favoritos, setFavoritos] = useState([]);

  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const favoritosSalvos = lerDadosUsuario("favoritos");
    setFavoritos(favoritosSalvos);

    async function carregarProdutos() {
      try {
        const resposta = await fetch("http://localhost:3000/produtos");

        if (!resposta.ok) {
          throw new Error("Erro ao buscar produtos.");
        }

        const dados = await resposta.json();
        setProdutos(dados);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();

    const intervalo = setInterval(() => {
      carregarProdutos();
    }, 15000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alternarFavorito(id) {
    let novosFavoritos;

    if (favoritos.includes(id)) {
      novosFavoritos = favoritos.filter((favoritoId) => favoritoId !== id);
    } else {
      novosFavoritos = [...favoritos, id];
    }

    setFavoritos(novosFavoritos);
    salvarDadosUsuario("favoritos", novosFavoritos);
  }

  function selecionarCategoria(valor) {
    setFiltro(valor);
    setBusca("");
  }

  function adicionarSacola(produto) {
    try {
      const carrinhoAtual = lerDadosUsuario("carrinho");
      const estoqueDisponivel = Number(
        produto.stock_quantity ?? produto.quantidade_estoque ?? 0
      );

      if (estoqueDisponivel <= 0) {
        alert("Produto indisponível no momento. O estoque foi zerado.");
        return;
      }

      const produtoExistente = carrinhoAtual.find(
        (item) => item.id === produto.id
      );
      const novaQuantidade = (produtoExistente?.quantidade || 0) + 1;

      if (novaQuantidade > estoqueDisponivel) {
        alert(
          `Quantidade indisponível. Apenas ${estoqueDisponivel} unidade${
            estoqueDisponivel > 1 ? "s" : ""
          } restante${estoqueDisponivel > 1 ? "s" : ""}.`
        );
        return;
      }

      let novoCarrinho;

      if (produtoExistente) {
        novoCarrinho = carrinhoAtual.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: novaQuantidade }
            : item
        );
      } else {
        novoCarrinho = [...carrinhoAtual, { ...produto, quantidade: 1 }];
      }

      salvarDadosUsuario("carrinho", novoCarrinho);
      navigate("/carrinho");
    } catch (error) {
      console.error("Erro ao adicionar produto à sacola:", error);
      alert("Não foi possível adicionar o produto ao carrinho. Tente novamente.");
    }
  }

  const produtosFiltrados = produtos.filter((produto) => {
    const correspondeCategoria =
      filtro === "todos" ? true : produto.categoria === filtro;

    const textoBusca = busca.toLowerCase().trim();

    const correspondeBusca =
      textoBusca === ""
        ? true
        : produto.nome.toLowerCase().includes(textoBusca) ||
          produto.categoria.toLowerCase().includes(textoBusca);

    return correspondeCategoria && correspondeBusca;
  });

  return (
    <div className="home-page">
      <Header
        busca={busca}
        onBuscaChange={setBusca}
        filtro={filtro}
        onFiltroChange={selecionarCategoria}
      />

      {busca && (
        <div className="search-result-text">
          Resultados para:
          <strong> {busca}</strong>
        </div>
      )}

      <main className="products-container">
        {carregando ? (
          <div className="products-loading">Carregando produtos...</div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="no-products">
            <FiHeart />

            <h2>Nenhum produto encontrado</h2>

            <p>Tente pesquisar outro produto ou escolher outra categoria.</p>

            <button
              onClick={() => {
                setBusca("");
                setFiltro("todos");
              }}
            >
              Ver todos os produtos
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {produtosFiltrados.map((produto) => {
              const estoqueInfo = obterStatusEstoque(produto);
              const semEstoque = estoqueInfo.estoqueDisponivel <= 0;

              return (
                <article
                  className={`product-card ${
                    semEstoque ? "product-card-empty" : ""
                  }`}
                  key={produto.id}
                  onClick={() => navigate(`/produto/${produto.id}`)}
                >
                  {produto.id === 1 && (
                    <span className="product-badge">Exclusivo</span>
                  )}

                  <button
                    className={
                      favoritos.includes(produto.id)
                        ? "favorite-button favorite-active"
                        : "favorite-button"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarFavorito(produto.id);
                    }}
                    aria-label={
                      favoritos.includes(produto.id)
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <FiHeart />
                  </button>

                  <div className="product-image">
                    <img src={produto.imagem} alt={produto.nome} />
                  </div>

                  <div className="product-info">
                    <div className="product-name-row">
                      <h3>{produto.nome}</h3>

                      <span className="rating">
                        ★★★★★
                        <small>{produto.avaliacao}</small>
                      </span>
                    </div>

                    <span className="product-info-categoria">
                      {produto.categoria}
                    </span>

                    <div className="price">
                      <span>
                        R$ {produto.preco.toFixed(2).replace(".", ",")}
                      </span>

                      <del>
                        R$ {produto.precoAntigo.toFixed(2).replace(".", ",")}
                      </del>

                      <b>{produto.desconto}%</b>
                    </div>

                    <div
                      className={`stock-chip ${
                        semEstoque
                          ? "stock-empty"
                          : estoqueInfo.tipo === "low"
                          ? "stock-low"
                          : "stock-ok"
                      }`}
                      title={estoqueInfo.tooltip}
                    >
                      {estoqueInfo.chip}
                    </div>

                    <button
                      className="add-cart"
                      disabled={semEstoque}
                      title={estoqueInfo.tooltip}
                      onClick={(e) => {
                        e.stopPropagation();
                        adicionarSacola(produto);
                      }}
                    >
                      {semEstoque ? "Produto indisponível" : estoqueInfo.botao}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}