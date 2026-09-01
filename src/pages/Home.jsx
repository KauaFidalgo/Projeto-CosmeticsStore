import "./home.css";

import { useEffect, useState } from "react";

import {
  FiSearch,
  FiHeart,
  FiShoppingBag,
  FiUser,
  FiLogOut,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

const produtos = [
  {
    id: 1,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "feminino",
    precoAntigo: 390,
    preco: 331.5,
    desconto: 15,
    imagem: "/images/restylane.png",
  },
  {
    id: 2,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "feminino",
    precoAntigo: 390,
    preco: 331.5,
    desconto: 15,
    imagem: "/images/restylane.png",
  },
  {
    id: 3,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "feminino",
    precoAntigo: 390,
    preco: 331.5,
    desconto: 15,
    imagem: "/images/restylane.png",
  },
  {
    id: 4,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "feminino",
    precoAntigo: 390,
    preco: 331.5,
    desconto: 15,
    imagem: "/images/restylane.png",
  },
  {
    id: 5,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "masculino",
    precoAntigo: 390,
    preco: 331.5,
    desconto: 15,
    imagem: "/images/restylane.png",
  },
  {
    id: 6,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "masculino",
    precoAntigo: 390,
    preco: 331.5,
    desconto: 15,
    imagem: "/images/restylane.png",
  },
  {
    id: 7,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "masculino",
    precoAntigo: 390,
    preco: 331.5,
    desconto: 15,
    imagem: "/images/restylane.png",
  },
  {
    id: 8,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "masculino",
    precoAntigo: 390,
    preco: 331.5,
    desconto: 15,
    imagem: "/images/restylane.png",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    // =========================
    // CARREGAR USUÁRIO
    // =========================

    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        localStorage.removeItem("usuarioLogado");
      }
    }

    // =========================
    // CARREGAR FAVORITOS
    // =========================

    const favoritosSalvos = localStorage.getItem("favoritos");

    if (favoritosSalvos) {
      try {
        const favoritosConvertidos = JSON.parse(favoritosSalvos);

        if (Array.isArray(favoritosConvertidos)) {
          setFavoritos(favoritosConvertidos);
        } else {
          setFavoritos([]);
        }
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        setFavoritos([]);
      }
    }
  }, []);

  // =========================
  // SAIR DA CONTA
  // =========================

  function sair() {
    localStorage.removeItem("usuarioLogado");

    setUsuario(null);

    navigate("/cadastro", { replace: true });
  }

  // =========================
  // FAVORITOS
  // =========================

  function alternarFavorito(id) {
    let novosFavoritos;

    if (favoritos.includes(id)) {
      novosFavoritos = favoritos.filter(
        (favoritoId) => favoritoId !== id
      );
    } else {
      novosFavoritos = [...favoritos, id];
    }

    setFavoritos(novosFavoritos);

    localStorage.setItem(
      "favoritos",
      JSON.stringify(novosFavoritos)
    );
  }

  // =========================
  // FILTROS
  // =========================

  function selecionarFiltro(tipo) {
    setFiltro(tipo);
    setBusca("");
  }

  // =========================
  // ADICIONAR NA SACOLA
  // =========================

  function adicionarSacola(produto) {
    try {
      const carrinhoSalvo = localStorage.getItem("carrinho");

      const carrinhoAtual = carrinhoSalvo
        ? JSON.parse(carrinhoSalvo)
        : [];

      const produtoExistente = carrinhoAtual.find(
        (item) => item.id === produto.id
      );

      let novoCarrinho;

      if (produtoExistente) {
        novoCarrinho = carrinhoAtual.map((item) =>
          item.id === produto.id
            ? {
                ...item,
                quantidade: (item.quantidade || 1) + 1,
              }
            : item
        );
      } else {
        novoCarrinho = [
          ...carrinhoAtual,
          {
            ...produto,
            quantidade: 1,
          },
        ];
      }

      localStorage.setItem(
        "carrinho",
        JSON.stringify(novoCarrinho)
      );

      // Vai direto para a sacola depois de adicionar
      navigate("/carrinho");
    } catch (error) {
      console.error("Erro ao adicionar produto à sacola:", error);
    }
  }

  // =========================
  // PRODUTOS FILTRADOS
  // =========================

  const produtosFiltrados = produtos.filter((produto) => {
    const correspondeGenero =
      filtro === "todos"
        ? true
        : filtro === "favoritos"
        ? favoritos.includes(produto.id)
        : produto.genero === filtro;

    const textoBusca = busca.toLowerCase().trim();

    const correspondeBusca =
      textoBusca === ""
        ? true
        : produto.nome.toLowerCase().includes(textoBusca) ||
          produto.categoria.toLowerCase().includes(textoBusca);

    return correspondeGenero && correspondeBusca;
  });

  return (
    <div className="home-page">

      {/* =========================
          PROMOÇÃO
      ========================= */}

      <div className="top-promotion">
        Frete grátis em compras acima de R$ 450
        <span>•</span>
        Consulta estética gratuita
      </div>

      {/* =========================
          HEADER
      ========================= */}

      <header className="home-header">

        <nav className="header-left">

          <button
            className={
              filtro === "todos"
                ? "header-filter active"
                : "header-filter"
            }
            onClick={() => selecionarFiltro("todos")}
          >
            Produto
          </button>

          <button
            className={
              filtro === "masculino"
                ? "header-filter active"
                : "header-filter"
            }
            onClick={() => selecionarFiltro("masculino")}
          >
            Masculino
          </button>

          <button
            className={
              filtro === "feminino"
                ? "header-filter active"
                : "header-filter"
            }
            onClick={() => selecionarFiltro("feminino")}
          >
            Feminino
          </button>

        </nav>

        {/* LOGO */}

        <button
          className="home-logo"
          onClick={() => navigate("/home")}
        >
          SC Medic
        </button>

        <div className="header-right">

          {/* PESQUISA */}

          <div className="search">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar"
              aria-label="Pesquisar produtos"
            />

            <FiSearch />
          </div>

          {/* FAVORITOS */}

          <button
            className="header-action"
            onClick={() => navigate("/favoritos")}
          >
            <FiHeart />
            <span>Favoritos</span>
          </button>

          {/* CONTA */}

          <div className="account">
            <FiUser />

            <span>
              {usuario
                ? usuario.nome?.split(" ")[0]
                : "Conta"}
            </span>
          </div>

          {/* SACOLA */}

          <button
            className="header-action"
            onClick={() => navigate("/carrinho")}
          >
            <FiShoppingBag />
            <span>Sacola</span>
          </button>

          {/* SAIR */}

          {usuario && (
            <button
              className="logout-button"
              onClick={sair}
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              <FiLogOut />
              <span>Sair</span>
            </button>
          )}

        </div>
      </header>

      {/* =========================
          RESULTADO DA PESQUISA
      ========================= */}

      {busca && (
        <div className="search-result-text">
          Resultados para:
          <strong> {busca}</strong>
        </div>
      )}

      {/* =========================
          PRODUTOS
      ========================= */}

      <main className="products-container">

        {produtosFiltrados.length === 0 ? (

          <div className="no-products">

            <FiHeart />

            <h2>Nenhum produto encontrado</h2>

            <p>
              Tente pesquisar outro produto ou escolher outra
              categoria.
            </p>

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
                onClick={() =>
                  navigate(`/produto/${produto.id}`)
                }
              >

                {/* EXCLUSIVO */}

                {produto.id === 1 && (
                  <span className="product-badge">
                    Exclusivo
                  </span>
                )}

                {/* FAVORITO */}

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

                {/* IMAGEM */}

                <div className="product-image">

                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                  />

                </div>

                {/* INFORMAÇÕES */}

                <div className="product-info">

                  <div className="product-name-row">

                    <h3>{produto.nome}</h3>

                    <span className="rating">
                      ★★★★★
                      <small>4.8</small>
                    </span>

                  </div>

                  <div className="price">

                    <span>
                      R${" "}
                      {produto.preco
                        .toFixed(2)
                        .replace(".", ",")}
                    </span>

                    <del>
                      R${" "}
                      {produto.precoAntigo
                        .toFixed(2)
                        .replace(".", ",")}
                    </del>

                    <b>{produto.desconto}%</b>

                  </div>

                  {/* =========================
                      ADICIONAR NA SACOLA
                  ========================= */}

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