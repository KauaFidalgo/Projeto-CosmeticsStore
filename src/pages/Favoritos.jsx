import "./favoritos.css";

import { useNavigate } from "react-router-dom";
import { FiHeart, FiTrash2 } from "react-icons/fi";
import { useEffect, useState } from "react";

import Header from "../components/Header";

export default function Favoritos() {
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [favoritos, setFavoritos] = useState(() => {
    try {
      const favoritosSalvos = localStorage.getItem("favoritos");

      if (!favoritosSalvos) {
        return [];
      }

      const favoritosConvertidos = JSON.parse(favoritosSalvos);

      return Array.isArray(favoritosConvertidos)
        ? favoritosConvertidos
        : [];
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
      return [];
    }
  });

  useEffect(() => {
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

  const produtosFavoritos = produtos.filter((produto) =>
    favoritos.includes(produto.id)
  );

  function removerFavorito(id) {
    const novosFavoritos = favoritos.filter(
      (favoritoId) => favoritoId !== id
    );

    setFavoritos(novosFavoritos);
    localStorage.setItem("favoritos", JSON.stringify(novosFavoritos));
  }

  function abrirProduto(id) {
    navigate(`/produto/${id}`);
  }

  return (
    <div className="favoritos-page">

      <Header />

      <main className="favoritos-content">

        <div className="favoritos-title">
          <span>SC MEDIC</span>
          <h1>Meus favoritos</h1>
          <p>Produtos que você salvou para comprar depois.</p>
        </div>

        {carregando ? (

          <div className="favoritos-loading">
            Carregando favoritos...
          </div>

        ) : produtosFavoritos.length === 0 ? (

          <div className="favoritos-vazio">
            <FiHeart />

            <h2>Nenhum favorito ainda</h2>

            <p>
              Salve seus produtos favoritos para encontrá-los facilmente.
            </p>

            <button onClick={() => navigate("/home")}>
              Voltar para a loja
            </button>
          </div>

        ) : (

          <div className="favoritos-grid">
            {produtosFavoritos.map((produto) => (
              <article className="favorito-card" key={produto.id}>

                <div
                  className="favorito-image"
                  onClick={() => abrirProduto(produto.id)}
                >
                  <img src={produto.imagem} alt={produto.nome} />
                </div>

                <div className="favorito-info">

                  <div className="favorito-name">
                    <h3>{produto.nome}</h3>

                    <button
                      onClick={() => removerFavorito(produto.id)}
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
                    <small>{produto.avaliacao}</small>
                  </div>

                  <div className="favorito-price">
                    <strong>
                      R$ {produto.preco.toFixed(2).replace(".", ",")}
                    </strong>

                    <del>
                      R$ {produto.precoAntigo.toFixed(2).replace(".", ",")}
                    </del>
                  </div>

                  <button
                    className="favorito-product-button"
                    onClick={() => abrirProduto(produto.id)}
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