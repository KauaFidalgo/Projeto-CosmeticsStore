import "./product.css";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import Header from "../components/Header";
import { FiHeart } from "react-icons/fi";
import { lerDadosUsuario, salvarDadosUsuario } from "../utils/storageUsuario";

export default function Product() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [produto, setProduto] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [imagemSelecionada, setImagemSelecionada] = useState(0);
  const [cep, setCep] = useState("");
  const [favoritado, setFavoritado] = useState(false);

  useEffect(() => {
    async function carregarProduto() {
      try {
        const resposta = await fetch(
          `http://localhost:3000/produtos/${id}`
        );

        if (!resposta.ok) {
          setProduto(null);
          return;
        }

        const dados = await resposta.json();
        setProduto(dados);
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
        setProduto(null);
      } finally {
        setCarregando(false);
      }
    }

    carregarProduto();
  }, [id]);

  useEffect(() => {
    try {
      const favoritos = lerDadosUsuario("favoritos");
      setFavoritado(Array.isArray(favoritos) && favoritos.includes(Number(id)));
    } catch (error) {
      setFavoritado(false);
    }
  }, [id]);

  if (carregando) {
    return (
      <div className="product-page">
        <Header />

        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Carregando produto...
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="product-page">
        <Header />

        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <h1>Produto não encontrado</h1>

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
      </div>
    );
  }

  const imagens = [produto.imagem, produto.imagem, produto.imagem];

  function adicionarSacola() {
    try {
      const carrinhoAtual = lerDadosUsuario("carrinho");

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

      salvarDadosUsuario("carrinho", novoCarrinho);
      navigate("/carrinho");
    } catch (error) {
      console.error("Erro ao adicionar à sacola:", error);
    }
  }

  function alternarFavorito() {
    try {
      const favoritos = lerDadosUsuario("favoritos");

      let novosFavoritos;

      if (favoritos.includes(produto.id)) {
        novosFavoritos = favoritos.filter(
          (favoritoId) => favoritoId !== produto.id
        );
        setFavoritado(false);
      } else {
        novosFavoritos = [...favoritos, produto.id];
        setFavoritado(true);
      }

      salvarDadosUsuario("favoritos", novosFavoritos);
    } catch (error) {
      console.error("Erro ao alterar favorito:", error);
    }
  }

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

      <Header />

      <main className="product-content">

        <div className="product-breadcrumb">
          Página inicial / Produto / {produto.nome}
        </div>

        <div className="product-main">

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
                  onClick={() => setImagemSelecionada(index)}
                >
                  <img src={imagem} alt={produto.nome} />
                </button>
              ))}
            </div>

            <div className="product-main-image">
              <img src={imagens[imagemSelecionada]} alt={produto.nome} />
            </div>

          </div>

          <section className="product-details">

            <h1>{produto.nome}</h1>

            <span className="product-age">{produto.categoria}</span>

            <div className="product-rating">
              <span>★★★★★</span>
              <small>{produto.avaliacao}</small>
            </div>

            <div className="product-price">
              <strong>
                R$ {produto.preco.toFixed(2).replace(".", ",")}
              </strong>

              <del>
                R$ {produto.precoAntigo.toFixed(2).replace(".", ",")}
              </del>

              <b>{produto.desconto}%</b>
            </div>

            <p className="installments">
              ou em 3x no cartão de R${" "}
              {(produto.preco / 3).toFixed(2).replace(".", ",")} sem juros
            </p>

            <div className="product-description">
              <strong>Descrição</strong>
              <p>{produto.descricao}</p>
              <button>Mais detalhes</button>
            </div>

            <button
              className="product-add-button"
              onClick={adicionarSacola}
            >
              Adicionar na sacola
            </button>

            <button
              className={
                favoritado
                  ? "product-favorite-button product-favorited"
                  : "product-favorite-button"
              }
              onClick={alternarFavorito}
            >
              {favoritado ? "Remover dos favoritos" : "Salvar como favorito"}
              <FiHeart />
            </button>

            <form
              className="shipping-calculator"
              onSubmit={calcularFrete}
            >
              <div className="shipping-title">
                <span>Calcular frete</span>

                <button
                  type="button"
                  onClick={() => alert("Digite seu CEP para consultar.")}
                >
                  Frete Grátis? Simule
                </button>
              </div>

              <div className="shipping-input">
                <input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  maxLength="9"
                />

                <button type="submit">Calcular</button>
              </div>
            </form>

          </section>

        </div>

      </main>

    </div>
  );
}