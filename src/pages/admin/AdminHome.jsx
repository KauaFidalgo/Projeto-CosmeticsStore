import "./admin.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiLogOut,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUser,
  FiCalendar,
} from "react-icons/fi";

import PedidoCard from "../../components/admin/PedidoCard";
import PedidoModal from "../../components/admin/PedidoModal";
import PerfilModal from "../../components/admin/PerfilModal";

import {
  STATUS_PEDIDO,
  formatarMoeda,
  getUsuarioLogado,
} from "../../utils/admin";

import {
  atualizarStatusPedido,
  listarPedidos,
} from "../../services/pedidosService";

export default function AdminHome() {
  const navigate = useNavigate();

  const usuario = getUsuarioLogado();

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const [pedidoAberto, setPedidoAberto] = useState(null);
  const [perfilAberto, setPerfilAberto] = useState(false);

  const carregarPedidos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);

    try {
      const dados = await listarPedidos();

      setPedidos(dados);
      setErro("");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os pedidos. Verifique se o JSON Server está rodando.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarPedidos();

    // Atualiza sozinho a cada 20s para novos pedidos aparecerem
    const intervalo = setInterval(() => carregarPedidos(true), 20000);

    return () => clearInterval(intervalo);
  }, [carregarPedidos]);

  async function alterarStatus(id, status) {
    try {
      await atualizarStatusPedido(id, status);

      setPedidos((atuais) =>
        atuais.map((p) => (p.id === id ? { ...p, status } : p)),
      );

      setPedidoAberto((atual) =>
        atual && atual.id === id ? { ...atual, status } : atual,
      );
    } catch (error) {
      console.error(error);
      alert("Não foi possível atualizar o status.");
    }
  }

  function sair() {
    localStorage.removeItem("usuarioLogado");
    navigate("/", { replace: true });
  }

  // =========================
  // FILTROS
  // =========================

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase().trim();

    return pedidos.filter((pedido) => {
      const correspondeStatus = filtro === "todos" || pedido.status === filtro;

      const correspondeBusca =
        texto === "" ||
        pedido.usuario?.nome?.toLowerCase().includes(texto) ||
        pedido.usuario?.email?.toLowerCase().includes(texto) ||
        pedido.usuario?.telefone?.includes(texto) ||
        pedido.itens?.some((item) => item.nome.toLowerCase().includes(texto));

      return correspondeStatus && correspondeBusca;
    });
  }, [pedidos, busca, filtro]);

  // =========================
  // ESTATÍSTICAS
  // =========================

  const hoje = new Date().toLocaleDateString("pt-BR");

  const pedidosHoje = pedidos.filter(
    (p) => new Date(p.criadoEm).toLocaleDateString("pt-BR") === hoje,
  ).length;

  const faturamento = pedidos.reduce((soma, p) => soma + (p.total || 0), 0);

  return (
    <div className="admin-page">
      {/* HEADER */}

      <header className="admin-header">
        <div className="admin-brand">
          <span className="admin-logo">SC Medic</span>
          <span className="admin-badge">Admin</span>
        </div>

        <div className="admin-header-actions">
          <button className="admin-action" onClick={() => setPerfilAberto(true)}>
            <FiUser />
            <span>{usuario?.nome?.split(" ")[0] || "Perfil"}</span>
          </button>

          <button className="admin-action admin-logout" onClick={sair}>
            <FiLogOut />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-title">
          <span className="admin-eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>Pedidos realizados</h1>
          <p>Acompanhe todas as compras feitas na loja em tempo real.</p>
        </div>

        {/* ESTATÍSTICAS */}

        <section className="admin-stats">
          <div className="stat-card">
            <FiPackage />
            <div>
              <small>Total de pedidos</small>
              <strong>{pedidos.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <FiCalendar />
            <div>
              <small>Pedidos hoje</small>
              <strong>{pedidosHoje}</strong>
            </div>
          </div>

          <div className="stat-card">
            <FiTrendingUp />
            <div>
              <small>Faturamento</small>
              <strong>{formatarMoeda(faturamento)}</strong>
            </div>
          </div>
        </section>

        {/* FERRAMENTAS */}

        <section className="admin-toolbar">
          <div className="admin-search">
            <FiSearch />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, e-mail, telefone ou produto"
            />
          </div>

          <div className="admin-filters">
            <button
              className={filtro === "todos" ? "chip active" : "chip"}
              onClick={() => setFiltro("todos")}
            >
              Todos
            </button>

            {STATUS_PEDIDO.map((s) => (
              <button
                key={s.valor}
                className={filtro === s.valor ? "chip active" : "chip"}
                onClick={() => setFiltro(s.valor)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            className="refresh-button"
            onClick={() => carregarPedidos()}
            title="Atualizar pedidos"
            aria-label="Atualizar pedidos"
          >
            <FiRefreshCw />
          </button>
        </section>

        {/* LISTA */}

        {carregando ? (
          <div className="admin-empty">
            <FiRefreshCw className="spin" />
            <h2>Carregando pedidos...</h2>
          </div>
        ) : erro ? (
          <div className="admin-empty">
            <FiPackage />
            <h2>Ops!</h2>
            <p>{erro}</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="admin-empty">
            <FiPackage />
            <h2>Nenhum pedido encontrado</h2>
            <p>
              {pedidos.length === 0
                ? "Quando um cliente finalizar uma compra, o pedido aparecerá aqui."
                : "Tente buscar por outro termo ou mudar o filtro."}
            </p>
          </div>
        ) : (
          <section className="pedidos-grid">
            {pedidosFiltrados.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onAbrir={setPedidoAberto}
              />
            ))}
          </section>
        )}
      </main>

      {pedidoAberto && (
        <PedidoModal
          pedido={pedidoAberto}
          onFechar={() => setPedidoAberto(null)}
          onStatus={alterarStatus}
        />
      )}

      {perfilAberto && usuario && (
        <PerfilModal usuario={usuario} onFechar={() => setPerfilAberto(false)} />
      )}
    </div>
  );
}