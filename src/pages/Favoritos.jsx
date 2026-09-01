import "./favoritos.css";

import { useNavigate } from "react-router-dom";

import {
  FiHeart,
  FiSearch,
  FiUser,
  FiShoppingBag,
  FiTrash2,
} from "react-icons/fi";

import { useState } from "react";

const produtos = [
  {
    id: 1,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "feminino",
    preco: 331.5,
    precoAntigo: 390,
    desconto: 15,
    imagem: "/images/restylane.png",
    avaliacao: "4.8",
  },
  {
    id: 2,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "feminino",
    preco: 331.5,
    precoAntigo: 390,
    desconto: 15,
    imagem: "/images/restylane.png",
    avaliacao: "4.8",
  },
  {
    id: 3,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "feminino",
    preco: 331.5,
    precoAntigo: 390,
    desconto: 15,
    imagem: "/images/restylane.png",
    avaliacao: "4.8",
  },
  {
    id: 4,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "feminino",
    preco: 331.5,
    precoAntigo: 390,
    desconto: 15,
    imagem: "/images/restylane.png",
    avaliacao: "4.8",
  },
  {
    id: 5,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "masculino",
    preco: 331.5,
    precoAntigo: 390,
    desconto: 15,
    imagem: "/images/restylane.png",
    avaliacao: "4.8",
  },
  {
    id: 6,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "masculino",
    preco: 331.5,
    precoAntigo: 390,
    desconto: 15,
    imagem: "/images/restylane.png",
    avaliacao: "4.8",
  },
  {
    id: 7,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "masculino",
    preco: 331.5,
    precoAntigo: 390,
    desconto: 15,
    imagem: "/images/restylane.png",
    avaliacao: "4.8",
  },
  {
    id: 8,
    nome: "Restylane Vital",
    categoria: "Preenchedor",
    genero: "masculino",
    preco: 331.5,
    precoAntigo: 390,
    desconto: 15,
    imagem: "/images/restylane.png",
    avaliacao: "4.8",
  },
];

export default function Favoritos() {
  const navigate = useNavigate();

  const [favoritos, setFavoritos] = useState(() => {
    try {
      const favoritosSalvos =
        localStorage.getItem("favoritos");

      if (!favoritosSalvos) {
        return [];
      }

      const favoritosConvertidos =
        JSON.parse(favoritosSalvos);

      return Array.isArray(favoritosConvertidos)
        ? favoritosConvertidos
        : [];
    } catch (error) {
      console.error(
        "Erro ao carregar favoritos:",
        error
      );

      return [];
    }
  });

  // =========================
  // PRODUTOS FAVORITOS
  // =========================

  const produtosFavoritos = produtos.filter((produto) =>
    favoritos.includes(produto.id)
  );

  // =========================
  // REMOVER SOMENTE UM
  // =========================

  function removerFavorito(id) {
    const novosFavoritos = favoritos.filter(
      (favoritoId) => favoritoId !== id
    );

    setFavoritos(novosFavoritos);

    localStorage.setItem(
      "favoritos",
      JSON.stringify(novosFavoritos)
    );
  }

  // =========================
  // ABRIR PRODUTO
  // =========================

  function abrirProduto(id) {
    navigate(`/produto/${id}`);
  }

  return (
    <div className="favoritos-page">

      {/* =========================
          PROMOÇÃO
      ========================= */}

      <div className="product-promotion">
        Frete grátis em compras acima de R$ 450
        <span>•</span>
        Consulta estética gratuita
      </div>

      {/* =========================
          HEADER
      ========================= */}

      <header className="product-header">

        <nav className="product-header-left">

          <a href="/home">
            Produto
          </a>

          <a href="/home">
            Masculino
          </a>

          <a href="/home">
            Feminino
          </a>

        </nav>

        {/* LOGO */}

        <button
          className="product-logo"
          onClick={() => navigate("/home")}
        >
          SC Medic
        </button>

        <div className="product-header-right">

          {/* PESQUISA */}

          <div className="product-search">

            <input
              placeholder="Pesquisar"
            />

            <FiSearch />

          </div>

          {/* FAVORITOS */}

          <button
            className="favorite-header-button"
            onClick={() => navigate("/favoritos")}
          >
            <FiHeart />
            <span>Favoritos</span>
          </button>

          {/* CONTA */}

          <button
            className="favorite-header-button"
            onClick={() => navigate("/home")}
          >
            <FiUser />
            <span>Conta</span>
          </button>

          {/* SACOLA */}

          <button
            className="product-bag-button"
            onClick={() => navigate("/carrinho")}
          >
            <FiShoppingBag />
            <span>Sacola</span>
          </button>

        </div>

      </header>

      {/* =========================
          CONTEÚDO
      ========================= */}

      <main className="favoritos-content">

        <div className="favoritos-title">

          <span>
            SC MEDIC
          </span>

          <h1>
            Meus favoritos
          </h1>

          <p>
            Produtos que você salvou para comprar depois.
          </p>

        </div>

        {/* =========================
            NENHUM FAVORITO
        ========================= */}

        {produtosFavoritos.length === 0 ? (

          <div className="favoritos-vazio">

            <FiHeart />

            <h2>
              Nenhum favorito ainda
            </h2>

            <p>
              Salve seus produtos favoritos para
              encontrá-los facilmente.
            </p>

            <button
              onClick={() => navigate("/home")}
            >
              Voltar para a loja
            </button>

          </div>

        ) : (

          /* =========================
             PRODUTOS FAVORITOS
          ========================= */

          <div className="favoritos-grid">

            {produtosFavoritos.map((produto) => (

              <article
                className="favorito-card"
                key={produto.id}
              >

                {/* IMAGEM */}

                <div
                  className="favorito-image"
                  onClick={() =>
                    abrirProduto(produto.id)
                  }
                >

                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                  />

                </div>

                {/* INFORMAÇÕES */}

                <div className="favorito-info">

                  <div className="favorito-name">

                    <h3>
                      {produto.nome}
                    </h3>

                    {/* EXCLUIR SOMENTE ESTE */}

                    <button
                      onClick={() =>
                        removerFavorito(produto.id)
                      }
                      title="Remover dos favoritos"
                      aria-label={`Remover ${produto.nome} dos favoritos`}
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                  <span className="favorito-category">
                    {produto.categoria}
                  </span>

                  <div className="favorito-rating">

                    ★★★★★

                    <small>
                      {produto.avaliacao}
                    </small>

                  </div>

                  <div className="favorito-price">

                    <strong>
                      R${" "}
                      {produto.preco
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>

                    <del>
                      R${" "}
                      {produto.precoAntigo
                        .toFixed(2)
                        .replace(".", ",")}
                    </del>

                  </div>

                  {/* VER PRODUTO */}

                  <button
                    className="favorito-product-button"
                    onClick={() =>
                      abrirProduto(produto.id)
                    }
                  >
                    Ver produto
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