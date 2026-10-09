import "./admin-finance.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiBarChart2,
  FiCalendar,
  FiDownload,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import { getUsuarioLogado } from "../../utils/admin";
import { buscarFinanceiroAdmin } from "../../services/pedidosService";

const formatterCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "month", label: "Mês atual" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Intervalo customizado" },
];

const CHART_COLORS = [
  "#0f172a",
  "#2d7ff9",
  "#14b8a6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#64748b",
];

function formatarMoeda(valor) {
  return formatterCurrency.format(Number(valor || 0));
}

function formatarData(data) {
  if (!data) return "—";
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status = "") {
  const value = String(status || "").toUpperCase();
  if (["PAGO", "APROVADO", "FATURADO", "ENTREGUE", "CONCLUIDO"].includes(value)) return "status paid";
  if (["PENDENTE", "EM_ANALISE"].includes(value)) return "status warning";
  if (["CANCELADO", "RECUSADO"].includes(value)) return "status danger";
  return "status neutral";
}

function exportarCsv(dados) {
  if (!dados?.data?.length) {
    return;
  }

  const cabecalho = [
    "Pedido",
    "Cliente",
    "Produto(s)",
    "Valor do Pedido",
    "Data/Hora",
    "Status do Pagamento",
  ];

  const linhas = [cabecalho];
  for (const item of dados.data) {
    linhas.push([
      item.orderId,
      item.clientName,
      item.productNames,
      String(item.amount),
      formatarData(item.createdAt),
      item.paymentStatus || "PAGO",
    ]);
  }

  const csv = linhas
    .map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `scmedic-financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminFinance() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("month");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarFinanceiro(nextPage = 1) {
    try {
      setCarregando(true);
      setErro("");

      const response = await buscarFinanceiroAdmin({
        period,
        search,
        startDate,
        endDate,
        page: nextPage,
        pageSize,
      });

      setDados(response);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
      setErro(error.message || "Não foi possível carregar o financeiro.");
      setDados({
        summary: { totalRevenue: 0, totalOrders: 0, averageTicket: 0 },
        charts: { categoryBreakdown: [], timeline: [] },
        data: [],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 1,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFinanceiro(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, pageSize]);

  const summary = dados?.summary || { totalRevenue: 0, totalOrders: 0, averageTicket: 0 };
  const categoryData = dados?.charts?.categoryBreakdown || [];
  const trendData = dados?.charts?.timeline || [];
  const totalPages = dados?.totalPages || 1;

  const growth = useMemo(() => {
    if (trendData.length < 2) return 0;
    const last = Number(trendData[trendData.length - 1]?.revenue || 0);
    const previous = Number(trendData[trendData.length - 2]?.revenue || 0);
    if (previous === 0) return 0;
    return Number((((last - previous) / previous) * 100).toFixed(1));
  }, [trendData]);

  const hasFilters = Boolean(search || startDate || endDate);

  return (
    <div className="admin-finance-page">
      <header className="finance-header">
        <button className="finance-back" onClick={() => navigate("/admin")}>
          <FiArrowLeft />
          Voltar
        </button>

        <div className="finance-header-copy">
          <span className="admin-eyebrow">FINANCEIRO</span>
          <h1>Dashboard de faturamento SC Medic</h1>
        </div>
      </header>

      <main className="finance-content">
        <section className="finance-filtros">
          <div className="search-field">
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente ou produto"
            />
          </div>

          <label className="filter-select">
            <span>Período</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-date">
            <span>Início</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>

          <label className="filter-date">
            <span>Fim</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>

          <div className="finance-actions">
            <button
              className="finance-button"
              onClick={() => carregarFinanceiro(1)}
            >
              Aplicar filtros
            </button>
            <button className="finance-button secondary" onClick={() => exportarCsv(dados)}>
              <FiDownload />
              Exportar CSV
            </button>
          </div>
        </section>

        {carregando ? (
          <div className="finance-skeleton-grid">
            <div className="skeleton-card long" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-panel large" />
            <div className="skeleton-panel" />
            <div className="skeleton-table" />
          </div>
        ) : erro ? (
          <div className="finance-empty error">{erro}</div>
        ) : (
          <>
            <section className="finance-cards">
              <div className="finance-card accent">
                <FiCalendar />
                <div>
                  <small>Faturamento no período</small>
                  <strong>{formatarMoeda(summary.totalRevenue)}</strong>
                </div>
              </div>

              <div className="finance-card">
                <FiBarChart2 />
                <div>
                  <small>Pedidos no período</small>
                  <strong>{summary.totalOrders}</strong>
                </div>
              </div>

              <div className="finance-card">
                <FiTrendingUp />
                <div>
                  <small>Ticket médio</small>
                  <strong>{formatarMoeda(summary.averageTicket)}</strong>
                </div>
              </div>
            </section>

            <section className="finance-analytics-grid">
              <div className="finance-chart-panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Faturamento por categoria</span>
                    <h2>Mix de produtos médicos</h2>
                  </div>
                </div>

                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatarMoeda(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-legend">
                  {categoryData.map((category, index) => (
                    <div key={`${category.name}-${index}`} className="legend-row">
                      <span className="dot" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="label">{category.name}</span>
                      <span className="value">{category.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="finance-chart-panel wide">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Comparativo temporal</span>
                    <h2>Faturamento x pedidos</h2>
                  </div>
                  <span className="trend-pill">
                    {growth >= 0 ? "+" : ""}
                    {growth}% vs período anterior
                  </span>
                </div>

                <div className="trend-chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f172a" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value, name) => [name === "revenue" ? formatarMoeda(value) : value, name === "revenue" ? "Faturamento" : "Pedidos"]} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" name="Faturamento" stroke="#0f172a" fill="url(#revenueGradient)" strokeWidth={3} />
                      <Area type="monotone" dataKey="orders" name="Pedidos" stroke="#14b8a6" fillOpacity={0} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="finance-table-panel">
              <div className="table-header">
                <div>
                  <span className="eyebrow">Histórico financeiro</span>
                  <h3>Transações da plataforma</h3>
                </div>
                <button className="finance-button secondary" onClick={() => exportarCsv(dados)}>
                  <FiDownload />
                  Exportar relatório
                </button>
              </div>

              {!dados?.data?.length ? (
                <div className="finance-empty">
                  {hasFilters ? "Nenhuma transação encontrada para os filtros selecionados." : "Nenhuma transação financeira registrada no período."}
                </div>
              ) : (
                <>
                  <div className="finance-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>Cliente</th>
                          <th>Produto(s)</th>
                          <th>Valor do pedido</th>
                          <th>Data/Hora</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.data.map((pedido) => (
                          <tr key={pedido.id}>
                            <td>{pedido.orderId}</td>
                            <td>{pedido.clientName}</td>
                            <td>{pedido.productNames}</td>
                            <td>{formatarMoeda(pedido.amount)}</td>
                            <td>{formatarData(pedido.createdAt)}</td>
                            <td>
                              <span className={getStatusClass(pedido.paymentStatus || pedido.status)}>
                                {pedido.paymentBadge?.label || pedido.paymentStatus || pedido.status || "Pago"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-pagination">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => carregarFinanceiro(page - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {page} de {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => carregarFinanceiro(page + 1)}
                    >
                      Próxima
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
