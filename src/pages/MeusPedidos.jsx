import "./meus-pedidos.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
  FiX,
} from "react-icons/fi";

import Header from "../components/Header";
import { getUsuarioLogado } from "../utils/admin";

const API_URL = "http://localhost:3000";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarHora(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizarStatus(status) {
  const raw = String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (["concluido", "concluida", "entregue", "entregues"].includes(raw)) return "concluido";
  if (["em separacao", "separacao", "em-separacao", "separando"].includes(raw)) return "em-separacao";
  if (["em andamento", "andamento", "enviado", "transporte", "em-transporte", "em rota"].includes(raw)) return "em-andamento";
  if (["novo", "pendente", "pendente pagamento"].includes(raw)) return "em-separacao";

  return "em-separacao";
}

function statusPedido(pedido) {
  const tipo = normalizarStatus(pedido?.status);

  const mapa = {
    "em-separacao": {
      label: "Em Separação",
      className: "status-separacao",
      badgeClass: "badge-separacao",
      icon: FiPackage,
    },
    "em-andamento": {
      label: "Em Andamento",
      className: "status-andamento",
      badgeClass: "badge-andamento",
      icon: FiTruck,
    },
    concluido: {
      label: "Concluído",
      className: "status-concluido",
      badgeClass: "badge-concluido",
      icon: FiCheckCircle,
    },
  };

  return mapa[tipo] || mapa["em-separacao"];
}

export default function MeusPedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const usuario = getUsuarioLogado();

    if (!usuario) {
      navigate("/", { replace: true });
      return;
    }

    async function carregarHistorico() {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usuario.id}`,
          "X-Role": "USER",
        };

        let dados = [];

        try {
          const response = await fetch(`${API_URL}/meus-pedidos`, { headers });
          if (response.ok) {
            dados = await response.json();
          } else {
            const fallback = await fetch(`${API_URL}/pedidos`, { headers });
            if (!fallback.ok) throw new Error("Sem pedidos disponíveis.");
            const lista = await fallback.json();
            dados = lista.filter(
              (pedido) => String(pedido?.usuario?.id || "") === String(usuario.id),
            );
          }
        } catch {
          const response = await fetch(`${API_URL}/pedidos`, { headers });
          if (response.ok) {
            const lista = await response.json();
            dados = lista.filter(
              (pedido) => String(pedido?.usuario?.id || "") === String(usuario.id),
            );
          }
        }

        setPedidos(
          (dados || []).sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0)),
        );
      } catch (error) {
        console.error(error);
        setPedidos([]);
        setErro("");
      } finally {
        setCarregando(false);
      }
    }

    carregarHistorico();
  }, [navigate]);

  const pedidosFiltrados = useMemo(() => {
    if (filtro === "todos") return pedidos;
    return pedidos.filter((pedido) => normalizarStatus(pedido.status) === filtro);
  }, [filtro, pedidos]);

  const totalGasto = useMemo(
    () => pedidos.reduce((acumulado, pedido) => acumulado + Number(pedido.total || 0), 0),
    [pedidos],
  );

  async function excluirPedido(pedido) {
    const status = normalizarStatus(pedido.status);
    if (status !== "concluido") return;

    const confirmar = window.confirm("Tem certeza de que deseja remover este pedido do seu histórico?");
    if (!confirmar) return;

    const usuario = getUsuarioLogado();

    try {
      const response = await fetch(`${API_URL}/api/orders/${pedido.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usuario.id}`,
          "X-Role": "USER",
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Este pedido não pode ser removido.");
      }

      setPedidos((atual) => atual.filter((pedidoAtual) => pedidoAtual.id !== pedido.id));
    } catch (error) {
      setErro(error.message || "Não foi possível excluir o pedido.");
    }
  }

  const tabs = [
    { key: "todos", label: "Todos" },
    { key: "em-separacao", label: "Em Separação" },
    { key: "em-andamento", label: "Em Andamento" },
    { key: "concluido", label: "Concluídos" },
  ];

  return (
    <div className="meus-pedidos-page">
      <Header />

      <main className="meus-pedidos-container">
        <div className="meus-pedidos-header">
          <button className="back-link-button" onClick={() => navigate("/perfil")}>
            <FiArrowLeft />
            Voltar
          </button>

          <div className="meus-pedidos-title-wrap">
            <span className="eyebrow">HISTÓRICO</span>
            <h1>Meus pedidos</h1>
          </div>
        </div>

        {!carregando && !erro && pedidos.length > 0 && (
          <section className="historico-resumo">
            <div>
              <small>Pedidos realizados</small>
              <strong>{pedidos.length}</strong>
            </div>

            <div>
              <small>Gasto total</small>
              <strong>{formatarMoeda(totalGasto)}</strong>
            </div>
          </section>
        )}

        {!carregando && pedidos.length > 0 && (
          <section className="status-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={filtro === tab.key ? "status-tab active" : "status-tab"}
                onClick={() => setFiltro(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </section>
        )}

        {carregando ? (
          <div className="historico-empty">Carregando compras...</div>
        ) : erro ? (
          <div className="historico-empty error">
            <FiAlertCircle />
            <h2>Não foi possível recuperar o histórico de pedidos.</h2>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="historico-empty">
            <FiShoppingBag />
            <h2>Nenhum pedido registrado</h2>
            <p>Seu histórico aparecerá aqui após a primeira compra.</p>
            <button className="historico-empty-button" onClick={() => navigate("/home")}>
              Explorar produtos
            </button>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="historico-empty">
            <FiShoppingBag />
            <h2>Nenhum pedido nesta aba</h2>
            <p>Você ainda não possui pedidos com esse status no momento.</p>
          </div>
        ) : (
          <div className="historico-lista">
            {pedidosFiltrados.map((pedido) => {
              const estado = statusPedido(pedido);
              const IconeStatus = estado.icon;
              const podeExcluir = normalizarStatus(pedido.status) === "concluido";

              return (
                <article key={pedido.id} className="historico-card">
                  <div className="historico-topo">
                    <div>
                      <small>Pedido</small>
                      <strong>#{String(pedido.id).slice(0, 6).toUpperCase()}</strong>
                    </div>

                    <span className={`historico-status ${estado.className}`}>
                      <IconeStatus />
                      {estado.label}
                    </span>
                  </div>

                  <div className="historico-meta">
                    <span>
                      <FiClock />
                      {formatarData(pedido.criadoEm)}
                    </span>
                    <span>
                      <FiPackage />
                      {pedido.itens?.length || 0} item(ns)
                    </span>
                    <span>{formatarMoeda(pedido.total)}</span>
                  </div>

                  <div className="historico-itens">
                    {pedido.itens?.map((item) => (
                      <div key={`${pedido.id}-${item.id}`} className="historico-item">
                        <img src={item.imagem} alt={item.nome} />
                        <div className="historico-item-copy">
                          <strong>{item.nome}</strong>
                          <p>{item.quantidade} unidade(s)</p>
                          <span>{formatarMoeda(item.preco * item.quantidade)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="historico-actions">
                    <button className="historico-button" onClick={() => setPedidoSelecionado(pedido)}>
                      <FiCheckCircle />
                      Ver detalhes do pedido
                    </button>

                    <button
                      type="button"
                      className={podeExcluir ? "historico-delete" : "historico-delete disabled"}
                      onClick={() => podeExcluir && excluirPedido(pedido)}
                      disabled={!podeExcluir}
                      title={
                        podeExcluir
                          ? "Remover pedido do histórico"
                          : "Pedidos em processamento ou transporte não podem ser removidos do histórico"
                      }
                    >
                      <FiTrash2 />
                      {podeExcluir ? "Excluir" : "Excluir indisponível"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {pedidoSelecionado && (
        <div className="historico-overlay" onClick={() => setPedidoSelecionado(null)}>
          <div className="historico-modal" onClick={(event) => event.stopPropagation()}>
            <button className="historico-modal-close" onClick={() => setPedidoSelecionado(null)}>
              <FiX />
            </button>

            <span className="eyebrow">COMPROVANTE</span>
            <h2>Pedido #{String(pedidoSelecionado.id).slice(0, 6).toUpperCase()}</h2>

            <div className="historico-modal-grid">
              <div>
                <small>Data e horário</small>
                <strong>
                  {formatarData(pedidoSelecionado.criadoEm)} às {formatarHora(pedidoSelecionado.criadoEm)}
                </strong>
              </div>

              <div>
                <small>Status</small>
                <strong className={`historico-status-inline ${statusPedido(pedidoSelecionado).className}`}>
                  {statusPedido(pedidoSelecionado).label}
                </strong>
              </div>

              <div>
                <small>Pagamento</small>
                <strong>{pedidoSelecionado.pagamento || "Não informado"}</strong>
              </div>

              <div>
                <small>Valor total</small>
                <strong>{formatarMoeda(pedidoSelecionado.total)}</strong>
              </div>
            </div>

            <div className="historico-modal-section">
              <h3>Itens comprados</h3>

              {pedidoSelecionado.itens?.map((item) => (
                <div key={`${pedidoSelecionado.id}-${item.id}`} className="historico-modal-item">
                  <img src={item.imagem} alt={item.nome} />
                  <div>
                    <strong>{item.nome}</strong>
                    <p>
                      {item.quantidade}x • {formatarMoeda(item.preco)} unitário
                    </p>
                  </div>
                  <span>{formatarMoeda(item.preco * item.quantidade)}</span>
                </div>
              ))}
            </div>

            <div className="historico-modal-section">
              <h3>Endereço de entrega</h3>
              <p>{pedidoSelecionado.endereco || "Endereço disponível no perfil do cliente."}</p>
            </div>

            <div className="historico-modal-totals">
              <div>
                <span>Subtotal</span>
                <strong>{formatarMoeda(pedidoSelecionado.subtotal || pedidoSelecionado.total)}</strong>
              </div>

              <div>
                <span>Desconto</span>
                <strong>- {formatarMoeda(pedidoSelecionado.desconto || 0)}</strong>
              </div>

              <div className="historico-modal-total">
                <span>Total pago</span>
                <strong>{formatarMoeda(pedidoSelecionado.total)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
