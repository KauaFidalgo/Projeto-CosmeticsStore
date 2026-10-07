import "./header.css";

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import CategoryDropdown from "./CategoryDropdown";

import {
  FiSearch,
  FiHeart,
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiPackage,
} from "react-icons/fi";

const categoriasPadrao = [
  { valor: "todos", nome: "Todas as categorias" },
  { valor: "Toxina Botulínica", nome: "Toxinas Botulínicas" },
  { valor: "Bioestimulador", nome: "Bioestimuladores" },
  { valor: "Preenchedor", nome: "Preenchedores" },
  { valor: "Skinbooster", nome: "Skinboosters" },
  { valor: "Fio de PDO", nome: "Fios de PDO" },
];

export default function Header({
  busca,
  onBuscaChange,
  filtro,
  onFiltroChange,
  categorias = categoriasPadrao,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [usuario, setUsuario] = useState(null);
  const [buscaLocal, setBuscaLocal] = useState(busca || "");

  const controlado = typeof onBuscaChange === "function";
  const filtroControlado = typeof onFiltroChange === "function";

  // =========================
  // CARREGAR USUÁRIO
  // =========================

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        localStorage.removeItem("usuarioLogado");
      }
    }
  }, []);

  useEffect(() => {
    if (controlado) {
      setBuscaLocal(busca || "");
    }
  }, [busca, controlado]);

  function sair() {
    localStorage.removeItem("usuarioLogado");
    setUsuario(null);
    navigate("/cadastro", { replace: true });
  }

  // =========================
  // BUSCA
  // =========================

  function alterarBusca(valor) {
    setBuscaLocal(valor);

    if (controlado) {
      onBuscaChange(valor);
    }
  }

  function pesquisar(e) {
    e.preventDefault();

    if (controlado) {
      return;
    }

    if (location.pathname !== "/home") {
      navigate(`/home?busca=${encodeURIComponent(buscaLocal)}`);
    }
  }

  // =========================
  // CATEGORIA
  // =========================

  function selecionarCategoria(valor) {
    if (filtroControlado) {
      onFiltroChange(valor);
      return;
    }

    navigate(`/home?categoria=${encodeURIComponent(valor)}`);
  }

  return (
    <>
      <div className="top-promotion">
        Frete grátis em compras acima de R$ 450
        <span>•</span>
        Consulta estética gratuita
      </div>

      <header className="home-header">

        <div className="header-left">
          <CategoryDropdown
            categorias={categorias}
            selecionado={filtroControlado ? filtro : "todos"}
            onSelecionar={selecionarCategoria}
          />
        </div>

        <button className="home-logo" onClick={() => navigate("/home")}>
          SC Medic
        </button>

        <div className="header-right">

          <form className="search" onSubmit={pesquisar}>
            <input
              type="text"
              value={buscaLocal}
              onChange={(e) => alterarBusca(e.target.value)}
              placeholder="Pesquisar"
              aria-label="Pesquisar produtos"
            />

            <button
              type="submit"
              className="search-button"
              aria-label="Pesquisar"
            >
              <FiSearch />
            </button>
          </form>

          <button
            className="header-action"
            onClick={() => navigate("/favoritos")}
          >
            <FiHeart />
            <span>Favoritos</span>
          </button>

          <button
            className="header-action"
            onClick={() => navigate("/meus-pedidos")}
          >
            <FiPackage />
            <span>Meus pedidos</span>
          </button>

          <button
            className="account"
            onClick={() => navigate("/perfil")}
            aria-label="Ver perfil"
          >
            <FiUser />
            <span>{usuario ? usuario.nome?.split(" ")[0] : "Conta"}</span>
          </button>

          <button
            className="header-action"
            onClick={() => navigate("/carrinho")}
          >
            <FiShoppingBag />
            <span>Sacola</span>
          </button>

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
    </>
  );
}