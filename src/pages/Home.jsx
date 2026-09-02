import "./home.css";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Header from "../components/Header";
import { FiHeart } from "react-icons/fi";

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
    // =========================
    // CARREGAR FAVORITOS
    // =========================

    const favoritosSalvos = localStorage.getItem("favoritos");

    if (favoritosSalvos) {
      try {
        const favoritosConvertidos = JSON.parse(favoritosSalvos);

        setFavoritos(
          Array.isArray(favoritosConvertidos) ? favoritosConvertidos : []
        );
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        setFavoritos([]);
      }
    }

    // =========================
    // CARREGAR PRODUTOS
    // =========================

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
  }, []);

  // Limpa a query (?busca=...&categoria=...) da URL depois de aplicar
  useEffect(() => {
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // FAVORITOS
  // =========================

  function alternarFavorito(id) {
    let novosFavoritos;

    if (favoritos.includes(id)) {
      novosFavoritos = favoritos.filter((favoritoId) => favoritoId !== id);
    } else {
      novosFavoritos = [...favoritos, id];
    }

    setFavoritos(novosFavoritos);
    localStorage.setItem("favoritos", JSON.stringify(novosFavoritos));
  }

  // =========================
  // CATEGORIA
  // =========================

  function selecionarCategoria(valor) {
    setFiltro(valor);
    setBusca("");
  }

  // =========================
  // ADICIONAR NA SACOLA
  // =========================

  function adicionarSacola(produto) {
    try {
      const carrinhoSalvo = localStorage.getItem("carrinho");
      const carrinhoAtual = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];

      const produtoExistente = carrinhoAtual.find(
        (item) => item.id === produto.id
      );

      let novoCarrinho;

      if (produtoExistente) {
        novoCarrinho = carrinhoAtual.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: (item.quantidade || 1) + 1 }
            : item
        );
      } else {
        novoCarrinho = [...carrinhoAtual, { ...produto, quantidade: 1 }];
      }

      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
      navigate("/carrinho");
    } catch (error) {
      console.error("Erro ao adicionar produto à sacola:", error);
    }
  }

  // =========================
  // PRODUTOS FILTRADOS
  // =========================

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

          <div className="products-loading">
            Carregando produtos...
          </div>

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
            {produtosFiltrados.map((produto) => (
              <article
                className="product-card"
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

                  <button
                    className="add-cart"
                    onClick={(e) => {
                      e.stopPropagation();
                      adicionarSacola(produto);
                    }}
                  >
                    Adicionar na sacola
                  </button>
                </div>
              </article>
            ))}
          </div>

        )}

      </main>

    </div>
  );
}