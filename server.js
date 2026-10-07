import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "db.json");
const PORT = Number(process.env.PORT || 3000);
const STATUS_FINANCEIRO = new Set(["PAGO", "CONCLUIDO", "ENTREGUE"]);

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");

      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error(`JSON inválido: ${error.message}`));
      }
    });
    req.on("error", reject);
  });
}

async function readDb() {
  const text = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(text);
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStock(value) {
  return Math.max(0, asNumber(value, 0));
}

function normalizeProductPayload(payload = {}) {
  const nome = String(payload.nome || "").trim();
  const descricao = String(payload.descricao || "").trim();
  const categoria = String(payload.categoria || "Preenchedor").trim();
  const preco = asNumber(payload.preco ?? 0, 0);
  const precoAntigo = asNumber(payload.precoAntigo ?? payload.preco ?? 0, preco);
  const avaliacao = asNumber(payload.avaliacao ?? 4.5, 4.5);
  const desconto = asNumber(payload.desconto ?? 0, 0);
  const stock = normalizeStock(payload.stock_quantity ?? payload.quantidade_estoque ?? 0);
  const imagens = Array.isArray(payload.imagens) && payload.imagens.length
    ? payload.imagens
    : [payload.imagem || "/images/restylane.png"];
  const imagemPrincipal = payload.imagem || imagens[0] || "/images/restylane.png";

  return {
    id: String(payload.id || Date.now()),
    nome,
    descricao,
    categoria,
    preco: Number(preco.toFixed(2)),
    precoAntigo: Number(precoAntigo.toFixed(2)),
    desconto: Number(desconto.toFixed(2)),
    imagem: imagemPrincipal,
    imagens,
    avaliacao: Number(avaliacao.toFixed(1)),
    quantidade_estoque: stock,
    stock_quantity: stock,
    status: String(payload.status || "Ativo").trim() || "Ativo",
    visivel: payload.visivel !== undefined ? Boolean(payload.visivel) : true,
  };
}

function normalizeItemPedido(item = {}) {
  const quantidade = Math.max(1, asNumber(item.quantidade ?? 1, 1));
  const preco = asNumber(item.preco ?? 0, 0);

  return {
    ...item,
    id: String(item.id || "item-sem-id"),
    nome: String(item.nome || "Produto").trim(),
    categoria: String(item.categoria || "Preenchedor").trim(),
    imagem: item.imagem || "/images/restylane.png",
    descricao: item.descricao || "",
    preco: Number(preco.toFixed(2)),
    quantidade,
  };
}

function getUserIdFromAuth(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const [, token] = authHeader.split(" ");
  return token ? String(token).trim() : null;
}

function isAdminRequest(req) {
  const role = String(req.headers["x-role"] || "").toUpperCase();
  return role === "ADMIN";
}

function isPedidoPago(pedido = {}) {
  const statusPagamento = String(
    pedido.statusPagamento || pedido.pagamentoStatus || pedido.status || "",
  )
    .toUpperCase()
    .trim();

  const statusPedido = String(pedido.status || "").toUpperCase().trim();
  return STATUS_FINANCEIRO.has(statusPagamento) || STATUS_FINANCEIRO.has(statusPedido) || statusPedido === "ENTREGUE";
}

function buildPedidoSnapshot(pedido, db) {
  const produtos = Array.isArray(db.produtos) ? db.produtos : [];
  const itens = (pedido.itens || []).map((item) => {
    const produto = produtos.find((produtoAtual) => String(produtoAtual.id) === String(item.id));
    const estoqueAtual = produto
      ? normalizeStock(produto.stock_quantity ?? produto.quantidade_estoque ?? 0)
      : 0;

    return {
      ...item,
      estoqueAtual,
      estoqueRestanteAtual: estoqueAtual,
      quantidadeReservadaNoPedido: asNumber(item.quantidade ?? 1, 1),
      estoqueReservadoNoPedido: asNumber(item.quantidade ?? 1, 1),
    };
  });

  return {
    ...pedido,
    itens,
    total: asNumber(pedido.total ?? 0, 0),
    subtotal: asNumber(pedido.subtotal ?? pedido.total ?? 0, 0),
    desconto: asNumber(pedido.desconto ?? 0, 0),
  };
}

function buildFinanceSummary(pedidos) {
  const pagos = pedidos.filter(isPedidoPago);
  const bruto = pagos.reduce((total, pedido) => total + asNumber(pedido.subtotal ?? 0, 0), 0);
  const liquido = pagos.reduce((total, pedido) => total + asNumber(pedido.total ?? 0, 0), 0);

  return {
    bruto: Number(bruto.toFixed(2)),
    liquido: Number(liquido.toFixed(2)),
    quantidadePedidos: pagos.length,
  };
}

function buildMonthlySeries(ano, pedidos) {
  const meses = Array.from({ length: 12 }, (_, index) => ({
    mes: index + 1,
    nome: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(Number(ano), index, 1)),
    ano: Number(ano),
    faturamento: 0,
    pedidos: 0,
  }));

  for (const pedido of pedidos) {
    const dataPedido = new Date(pedido.criadoEm);
    if (Number.isNaN(dataPedido.getTime()) || dataPedido.getFullYear() !== Number(ano)) continue;

    const mesIndex = dataPedido.getMonth();
    if (!meses[mesIndex]) continue;

    meses[mesIndex].faturamento += asNumber(pedido.total ?? pedido.subtotal ?? 0, 0);
    meses[mesIndex].pedidos += 1;
  }

  return meses.map((mes) => ({
    ...mes,
    faturamento: Number(mes.faturamento.toFixed(2)),
  }));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Role");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const db = await readDb();
    let produtos = Array.isArray(db.produtos) ? db.produtos.map(normalizeProductPayload) : [];
    db.produtos = produtos;

    if (req.method === "GET" && url.pathname === "/produtos") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(produtos));
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/produtos/")) {
      const id = url.pathname.split("/").pop();
      const produto = produtos.find((item) => String(item.id) === String(id));

      if (!produto) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Produto não encontrado" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(produto));
      return;
    }

    if (req.method === "POST" && url.pathname === "/produtos") {
      const body = await parseBody(req);
      if (!body || !body.nome || !body.descricao) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Nome e descrição são obrigatórios." }));
        return;
      }

      const novoProduto = normalizeProductPayload(body);
      db.produtos = [...produtos, novoProduto];
      await writeDb(db);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(novoProduto));
      return;
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/produtos/")) {
      const id = url.pathname.split("/").pop();
      const body = await parseBody(req);
      const index = produtos.findIndex((item) => String(item.id) === String(id));

      if (index === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Produto não encontrado" }));
        return;
      }

      const atual = produtos[index];
      const atualizado = {
        ...atual,
        ...body,
        imagem: body.imagem || atual.imagem || "/images/restylane.png",
        imagens: Array.isArray(body.imagens) && body.imagens.length ? body.imagens : atual.imagens,
        status: body.status || atual.status || "Ativo",
        visivel: body.visivel !== undefined ? Boolean(body.visivel) : atual.visivel,
      };

      const stockValue = body.stock_quantity ?? body.quantidade_estoque ?? atual.stock_quantity ?? atual.quantidade_estoque ?? 0;
      atualizado.quantidade_estoque = normalizeStock(stockValue);
      atualizado.stock_quantity = atualizado.quantidade_estoque;

      if (body.preco !== undefined) atualizado.preco = Number(body.preco);
      if (body.precoAntigo !== undefined) atualizado.precoAntigo = Number(body.precoAntigo);
      if (body.avaliacao !== undefined) atualizado.avaliacao = Number(body.avaliacao);
      if (body.desconto !== undefined) atualizado.desconto = Number(body.desconto);

      produtos[index] = normalizeProductPayload(atualizado);
      db.produtos = produtos;
      await writeDb(db);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(produtos[index]));
      return;
    }

    if (req.method === "DELETE" && (url.pathname.startsWith("/pedidos/") || url.pathname.startsWith("/api/orders/"))) {
      const id = url.pathname.split("/").pop();
      const requesterId = getUserIdFromAuth(req);
      const pedidos = Array.isArray(db.pedidos) ? db.pedidos : [];
      const indice = pedidos.findIndex((pedido) => String(pedido.id) === String(id));

      if (indice === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Pedido não encontrado" }));
        return;
      }

      const pedidoAtual = pedidos[indice];
      const statusPedido = String(pedidoAtual.status || "").trim().toLowerCase();
      const ePedidoConcluido = ["concluido", "entregue"].includes(statusPedido);
      const pertenceAoUsuario = requesterId && String(pedidoAtual.usuario?.id || "") === String(requesterId);

      if (!requesterId || !pertenceAoUsuario || !ePedidoConcluido) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          error: "A exclusão de pedidos só é permitida para pedidos concluídos que pertençam ao usuário autenticado.",
        }));
        return;
      }

      pedidos.splice(indice, 1);
      db.pedidos = pedidos;
      await writeDb(db);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "GET" && (url.pathname === "/pedidos" || url.pathname === "/meus-pedidos")) {
      const pedidos = Array.isArray(db.pedidos) ? db.pedidos : [];
      const requesterId = getUserIdFromAuth(req);
      const adminRequest = isAdminRequest(req);
      const userFilter = url.searchParams.get("user_id") || requesterId;

      if (!adminRequest && !requesterId) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Autenticação necessária para consultar pedidos." }));
        return;
      }

      const filtrados = pedidos
        .map((pedido) => buildPedidoSnapshot(pedido, db))
        .filter((pedido) => {
          if (adminRequest) return true;
          if (!requesterId) return false;
          if (url.pathname === "/meus-pedidos") {
            return String(pedido.usuario?.id) === String(requesterId);
          }
          if (userFilter) {
            if (String(userFilter) !== String(requesterId)) {
              return false;
            }
            return String(pedido.usuario?.id) === String(requesterId);
          }
          return String(pedido.usuario?.id) === String(requesterId);
        });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(filtrados));
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/admin/usuarios/")) {
      const matched = url.pathname.match(/^\/admin\/usuarios\/([^/]+)\/historico(?:\/)?$/);
      if (!matched) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Rota de histórico do usuário não encontrada." }));
        return;
      }

      if (!isAdminRequest(req)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Acesso negado. Perfil ADMIN é obrigatório." }));
        return;
      }

      const userId = matched[1];
      const pedidos = Array.isArray(db.pedidos) ? db.pedidos : [];
      const historico = pedidos
        .map((pedido) => buildPedidoSnapshot(pedido, db))
        .filter((pedido) => String(pedido.usuario?.id) === String(userId));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(historico));
      return;
    }

    if (req.method === "GET" && url.pathname === "/relatorios/faturamento") {
      const pedidos = Array.isArray(db.pedidos) ? db.pedidos : [];
      const anoParam = url.searchParams.get("ano");
      const mesParam = url.searchParams.get("mes");
      const inicioParam = url.searchParams.get("dataInicio");
      const fimParam = url.searchParams.get("dataFim");

      const ano = anoParam ? Number(anoParam) : new Date().getFullYear();
      const mes = mesParam ? Number(mesParam) : null;
      const inicio = inicioParam ? new Date(inicioParam) : null;
      const fim = fimParam ? new Date(fimParam) : null;

      let filtrados = pedidos.filter(isPedidoPago);

      if (ano) {
        filtrados = filtrados.filter((pedido) => {
          const dataPedido = new Date(pedido.criadoEm);
          return !Number.isNaN(dataPedido.getTime()) && dataPedido.getFullYear() === ano;
        });
      }

      if (mes) {
        filtrados = filtrados.filter((pedido) => {
          const dataPedido = new Date(pedido.criadoEm);
          return !Number.isNaN(dataPedido.getTime()) && dataPedido.getMonth() + 1 === mes;
        });
      }

      if (inicio && !Number.isNaN(inicio.getTime())) {
        filtrados = filtrados.filter((pedido) => new Date(pedido.criadoEm) >= inicio);
      }

      if (fim && !Number.isNaN(fim.getTime())) {
        filtrados = filtrados.filter((pedido) => new Date(pedido.criadoEm) <= fim);
      }

      const resumo = buildFinanceSummary(filtrados);
      const series = buildMonthlySeries(ano, pedidos.filter(isPedidoPago));

      const payload = {
        ano,
        mes,
        filtros: {
          dataInicio: inicioParam || null,
          dataFim: fimParam || null,
        },
        resumo: {
          bruto: resumo.bruto,
          liquido: resumo.liquido,
          quantidadePedidos: resumo.quantidadePedidos,
          variacaoPeriodoAnterior: 0,
        },
        series,
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === "POST" && url.pathname === "/pedidos") {
      const body = await parseBody(req);
      const requesterId = getUserIdFromAuth(req);
      const payload = body && typeof body === "object" ? body : {};
      const usuarioId = payload.usuario?.id || requesterId || null;

      if (!payload.itens || !Array.isArray(payload.itens) || payload.itens.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Pedido sem itens." }));
        return;
      }

      if (requesterId && usuarioId && String(requesterId) !== String(usuarioId)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Você não pode criar um pedido para outro usuário." }));
        return;
      }

      const itensNormalizados = payload.itens.map(normalizeItemPedido);
      const errosEstoque = [];

      for (const item of itensNormalizados) {
        const produto = produtos.find((produtoAtual) => String(produtoAtual.id) === String(item.id));
        if (!produto) {
          errosEstoque.push({ produtoId: item.id, motivo: "Produto não encontrado" });
          continue;
        }

        const estoqueAtual = normalizeStock(produto.stock_quantity ?? produto.quantidade_estoque ?? 0);
        const solicitada = asNumber(item.quantidade ?? 1, 1);
        if (estoqueAtual < solicitada) {
          errosEstoque.push({
            produtoId: item.id,
            produto: produto.nome,
            estoqueAtual,
            solicitada,
            motivo: "Estoque insuficiente",
          });
        }
      }

      if (errosEstoque.length > 0) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Estoque insuficiente para alguns itens.", detalhe: errosEstoque }));
        return;
      }

      for (const item of itensNormalizados) {
        const produto = produtos.find((produtoAtual) => String(produtoAtual.id) === String(item.id));
        if (!produto) continue;
        const estoqueAtual = normalizeStock(produto.stock_quantity ?? produto.quantidade_estoque ?? 0);
        produto.quantidade_estoque = Math.max(0, estoqueAtual - asNumber(item.quantidade ?? 1, 1));
        produto.stock_quantity = produto.quantidade_estoque;
      }

      const pedidoCriado = {
        id: String(payload.id || Date.now()),
        criadoEm: payload.criadoEm || new Date().toISOString(),
        status: payload.status || "novo",
        statusPagamento: payload.statusPagamento || "PAGO",
        pagamento: payload.pagamento || "pix",
        parcelas: payload.parcelas ?? null,
        detalhesPagamento: payload.detalhesPagamento || {},
        usuario: payload.usuario || {
          id: requesterId || "usuario-anonimo",
          nome: "Cliente",
          email: "",
          telefone: "",
        },
        endereco: payload.endereco || "",
        itens: itensNormalizados,
        subtotal: asNumber(payload.subtotal ?? 0, 0),
        desconto: asNumber(payload.desconto ?? 0, 0),
        total: asNumber(payload.total ?? 0, 0),
      };

      db.produtos = produtos;
      db.pedidos = Array.isArray(db.pedidos) ? [...db.pedidos, pedidoCriado] : [pedidoCriado];
      await writeDb(db);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(pedidoCriado));
      return;
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/pedidos/")) {
      const id = url.pathname.split("/").pop();
      const body = await parseBody(req);
      const pedidos = Array.isArray(db.pedidos) ? db.pedidos : [];
      const index = pedidos.findIndex((pedido) => String(pedido.id) === String(id));

      if (index === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Pedido não encontrado" }));
        return;
      }

      const pedidoAtualizado = {
        ...pedidos[index],
        ...body,
      };

      if (body.status) pedidoAtualizado.status = String(body.status);
      if (body.statusPagamento) pedidoAtualizado.statusPagamento = String(body.statusPagamento).toUpperCase();
      if (body.total !== undefined) pedidoAtualizado.total = Number(body.total);
      if (body.subtotal !== undefined) pedidoAtualizado.subtotal = Number(body.subtotal);
      if (body.desconto !== undefined) pedidoAtualizado.desconto = Number(body.desconto);

      pedidos[index] = pedidoAtualizado;
      db.pedidos = pedidos;
      await writeDb(db);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(pedidoAtualizado));
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/pedidos/")) {
      const id = url.pathname.split("/").pop();
      const requesterId = getUserIdFromAuth(req);
      const pedidos = Array.isArray(db.pedidos) ? db.pedidos : [];
      const indice = pedidos.findIndex((pedido) => String(pedido.id) === String(id));

      if (indice === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Pedido não encontrado" }));
        return;
      }

      const pedidoAtual = pedidos[indice];
      const statusPedido = String(pedidoAtual.status || "").trim().toLowerCase();
      const pertenceAoUsuario = requesterId && String(pedidoAtual.usuario?.id || "") === String(requesterId);

      if (!requesterId || !pertenceAoUsuario || statusPedido !== "concluido") {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          error: "A exclusão de pedidos só é permitida para pedidos concluídos que pertençam ao usuário autenticado.",
        }));
        return;
      }

      pedidos.splice(indice, 1);
      db.pedidos = pedidos;
      await writeDb(db);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Rota não encontrada" }));
  } catch (error) {
    console.error("Erro no servidor:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message || "Erro interno do servidor" }));
  }
});

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  server.listen(PORT, () => {
    console.log(`JSON Server custom rodando em http://localhost:${PORT}`);
  });
}

export { buildFinanceSummary, isPedidoPago, normalizeProductPayload, normalizeItemPedido, buildMonthlySeries };
