import "./product.css";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useState } from "react";

import {
  FiHeart,
  FiSearch,
  FiUser,
  FiShoppingBag,
} from "react-icons/fi";

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
    descricao:
      "O Restylane Skinboosters™ Vital é um bioestimulador e hidratante injetável de ácido hialurônico. Desenvolvido pela Galderma, é indicado para rejuvenescimento da pele e melhora da elasticidade, reduzir linhas finas e restaurar o equilíbrio hídrico.",
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
    descricao:
      "O Restylane Skinboosters™ Vital é um bioestimulador e hidratante injetável de ácido hialurônico. Desenvolvido pela Galderma, é indicado para rejuvenescimento da pele e melhora da elasticidade, reduzir linhas finas e restaurar o equilíbrio hídrico.",
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
    descricao:
      "O Restylane Skinboosters™ Vital é um bioestimulador e hidratante injetável de ácido hialurônico. Desenvolvido pela Galderma, é indicado para rejuvenescimento da pele e melhora da elasticidade, reduzir linhas finas e restaurar o equilíbrio hídrico.",
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
    descricao:
      "O Restylane Skinboosters™ Vital é um bioestimulador e hidratante injetável de ácido hialurônico. Desenvolvido pela Galderma, é indicado para rejuvenescimento da pele e melhora da elasticidade, reduzir linhas finas e restaurar o equilíbrio hídrico.",
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
    descricao:
      "O Restylane Skinboosters™ Vital é um bioestimulador e hidratante injetável de ácido hialurônico. Desenvolvido pela Galderma, é indicado para rejuvenescimento da pele e melhora da elasticidade, reduzir linhas finas e restaurar o equilíbrio hídrico.",
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
    descricao:
      "O Restylane Skinboosters™ Vital é um bioestimulador e hidratante injetável de ácido hialurônico. Desenvolvido pela Galderma, é indicado para rejuvenescimento da pele e melhora da elasticidade, reduzir linhas finas e restaurar o equilíbrio hídrico.",
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
    descricao:
      "O Restylane Skinboosters™ Vital é um bioestimulador e hidratante injetável de ácido hialurônico. Desenvolvido pela Galderma, é indicado para rejuvenescimento da pele e melhora da elasticidade, reduzir linhas finas e restaurar o equilíbrio hídrico.",
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
    descricao:
      "O Restylane Skinboosters™ Vital é um bioestimulador e hidratante injetável de ácido hialurônico. Desenvolvido pela Galderma, é indicado para rejuvenescimento da pele e melhora da elasticidade, reduzir linhas finas e restaurar o equilíbrio hídrico.",
  },
];

export default function Product() {
  const navigate = useNavigate();

  const { id } = useParams();

  const produto = produtos.find(
    (item) => item.id === Number(id)
  );

  const [imagemSelecionada, setImagemSelecionada] =
    useState(0);

  const [cep, setCep] = useState("");

  const [favoritado, setFavoritado] = useState(() => {
    try {
      const favoritosSalvos =
        localStorage.getItem("favoritos");

      const favoritos = favoritosSalvos
        ? JSON.parse(favoritosSalvos)
        : [];

      return (
        Array.isArray(favoritos) &&
        favoritos.includes(Number(id))
      );
    } catch (error) {
      return false;
    }
  });

  // =========================
  // PRODUTO NÃO EXISTE
  // =========================

  if (!produto) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <h1>
          Produto não encontrado
        </h1>

        <button
          onClick={() => navigate("/home")}
          style={{
            padding: "12px 25px",
            border: "none",
            borderRadius: "8px",
            background: "#e34792",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Voltar para a loja
        </button>
      </div>
    );
  }

  // =========================
  // IMAGENS
  // =========================

  const imagens = [
    produto.imagem,
    produto.imagem,
    produto.imagem,
  ];

  // =========================
  // ADICIONAR NA SACOLA
  // =========================

  function adicionarSacola() {
    try {
      const carrinhoSalvo =
        localStorage.getItem("carrinho");

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

      // Depois de adicionar, vai para a sacola
      navigate("/carrinho");
    } catch (error) {
      console.error(
        "Erro ao adicionar à sacola:",
        error
      );
    }
  }

  // =========================
  // FAVORITO
  // =========================

  function alternarFavorito() {
    try {
      const favoritosSalvos =
        localStorage.getItem("favoritos");

      const favoritos = favoritosSalvos
        ? JSON.parse(favoritosSalvos)
        : [];

      let novosFavoritos;

      if (favoritos.includes(produto.id)) {
        novosFavoritos = favoritos.filter(
          (favoritoId) =>
            favoritoId !== produto.id
        );

        setFavoritado(false);
      } else {
        novosFavoritos = [
          ...favoritos,
          produto.id,
        ];

        setFavoritado(true);
      }

      localStorage.setItem(
        "favoritos",
        JSON.stringify(novosFavoritos)
      );
    } catch (error) {
      console.error(
        "Erro ao alterar favorito:",
        error
      );
    }
  }

  // =========================
  // CALCULAR FRETE
  // =========================

  function calcularFrete(e) {
    e.preventDefault();

    if (!cep) {
      alert("Digite seu CEP.");
      return;
    }

    alert("Frete grátis para este produto.");
  }

  return (
    <div className="product-page">

      {/* PROMOÇÃO */}

      <div className="product-promotion">
        Frete grátis em compras acima de R$ 450
        <span>•</span>
        Consulta estética gratuita
      </div>

      {/* HEADER */}

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
            className="product-favorite-header"
            onClick={() => navigate("/favoritos")}
          >
            <FiHeart />
            <span>Favoritos</span>
          </button>

          {/* CONTA */}

          <button
            className="product-favorite-header"
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

      {/* CONTEÚDO */}

      <main className="product-content">

        <div className="product-breadcrumb">
          Página inicial / Produto / {produto.nome}
        </div>

        <div className="product-main">

          {/* GALERIA */}

          <div className="product-gallery">

            <div className="product-thumbnails">

              {imagens.map((imagem, index) => (

                <button
                  key={index}
                  className={
                    imagemSelecionada === index
                      ? "thumbnail active"
                      : "thumbnail"
                  }
                  onClick={() =>
                    setImagemSelecionada(index)
                  }
                >
                  <img
                    src={imagem}
                    alt={produto.nome}
                  />
                </button>

              ))}

            </div>

            <div className="product-main-image">

              <img
                src={imagens[imagemSelecionada]}
                alt={produto.nome}
              />

            </div>

          </div>

          {/* DETALHES */}

          <section className="product-details">

            <h1>
              {produto.nome}
            </h1>

            <span className="product-age">
              {produto.categoria}
            </span>

            <div className="product-rating">

              <span>
                ★★★★★
              </span>

              <small>
                {produto.avaliacao}
              </small>

            </div>

            <div className="product-price">

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

              <b>
                {produto.desconto}%
              </b>

            </div>

            <p className="installments">
              ou em 3x no cartão de R$110,00 sem juros
            </p>

            {/* DESCRIÇÃO */}

            <div className="product-description">

              <strong>
                Descrição
              </strong>

              <p>
                {produto.descricao}
              </p>

              <button>
                Mais detalhes
              </button>

            </div>

            {/* ADICIONAR */}

            <button
              className="product-add-button"
              onClick={adicionarSacola}
            >
              Adicionar na sacola
            </button>

            {/* FAVORITO */}

            <button
              className={
                favoritado
                  ? "product-favorite-button product-favorited"
                  : "product-favorite-button"
              }
              onClick={alternarFavorito}
            >
              {favoritado
                ? "Remover dos favoritos"
                : "Salvar como favorito"}

              <FiHeart />
            </button>

            {/* FRETE */}

            <form
              className="shipping-calculator"
              onSubmit={calcularFrete}
            >

              <div className="shipping-title">

                <span>
                  Calcular frete
                </span>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Digite seu CEP para consultar."
                    )
                  }
                >
                  Frete Grátis? Simule
                </button>

              </div>

              <div className="shipping-input">

                <input
                  value={cep}
                  onChange={(e) =>
                    setCep(e.target.value)
                  }
                  placeholder="00000-000"
                  maxLength="9"
                />

                <button type="submit">
                  Calcular
                </button>

              </div>

            </form>

          </section>

        </div>

      </main>

    </div>
  );
}