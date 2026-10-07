const API_URL = "http://localhost:3000";

function getAuthHeaders(extra = {}) {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
  const role = usuario?.email?.toLowerCase().endsWith("@scmedicadmin.com")
    ? "ADMIN"
    : "USER";

  return {
    "Content-Type": "application/json",
    Authorization: usuario?.id ? `Bearer ${usuario.id}` : "",
    "X-Role": role,
    ...extra,
  };
}

export async function listarPedidos() {
  const response = await fetch(`${API_URL}/pedidos`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Erro ao buscar pedidos.");

  const pedidos = await response.json();

  return pedidos.sort(
    (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm),
  );
}

export async function listarMeusPedidos() {
  const response = await fetch(`${API_URL}/meus-pedidos`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Erro ao buscar histórico do cliente.");

  return (await response.json()).sort(
    (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm),
  );
}

export async function listarHistoricoUsuario(userId) {
  const response = await fetch(
    `${API_URL}/admin/usuarios/${userId}/historico`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) throw new Error("Erro ao buscar histórico do usuário.");

  return (await response.json()).sort(
    (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm),
  );
}

export async function buscarFaturamento(params = {}) {
  const query = new URLSearchParams();

  if (params.ano) query.set("ano", String(params.ano));
  if (params.mes) query.set("mes", String(params.mes));
  if (params.dataInicio) query.set("dataInicio", params.dataInicio);
  if (params.dataFim) query.set("dataFim", params.dataFim);

  const response = await fetch(
    `${API_URL}/relatorios/faturamento?${query.toString()}`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) throw new Error("Erro ao buscar faturamento.");

  return response.json();
}

export async function criarPedido(pedido) {
  const response = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Erro ao registrar pedido.");
  }

  const pedidoCriado = await response.json();

  // Implementa regra de negócio: baixar estoque ao criar pedido
  // (simulando pagamento confirmado imediatamente)
  if (pedidoCriado.itens) {
    await atualizarEstoque(pedidoCriado.itens);
  }

  return pedidoCriado;
}

export async function atualizarStatusPedido(id, status) {
  const response = await fetch(`${API_URL}/pedidos/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) throw new Error("Erro ao atualizar status.");

  return response.json();
}

/**
 * Valida se a quantidade solicitada está disponível em estoque
 * @param {string} produtoId - ID do produto
 * @param {number} quantidade - Quantidade desejada
 * @returns {Promise<boolean>} true se há estoque suficiente
 */
export async function validarEstoque(produtoId, quantidade) {
  try {
    const response = await fetch(`${API_URL}/produtos/${produtoId}`);

    if (!response.ok) throw new Error("Produto não encontrado.");

    const produto = await response.json();
    const estoqueDisponivel = Number(
      produto.stock_quantity ?? produto.quantidade_estoque ?? 0,
    );

    return estoqueDisponivel >= Number(quantidade || 0);
  } catch (error) {
    console.error("Erro ao validar estoque:", error);
    return false;
  }
}

/**
 * Atualiza o estoque dos produtos após confirmar o pedido
 * @param {Array} itens - Lista de itens do pedido
 */
export async function atualizarEstoque(itens) {
  if (!itens || itens.length === 0) return;

  try {
    for (const item of itens) {
      const response = await fetch(`${API_URL}/produtos/${item.id}`);
      if (!response.ok) continue;

      const produto = await response.json();
      const novaQuantidade = Math.max(
        0,
        Number(produto.stock_quantity ?? produto.quantidade_estoque ?? 0) -
          Number(item.quantidade || 0),
      );

      await fetch(`${API_URL}/produtos/${item.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          stock_quantity: novaQuantidade,
          quantidade_estoque: novaQuantidade,
        }),
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
  }
}

/**
 * Deleta um pedido do sistema
 * @param {string} pedidoId - ID do pedido a ser deletado
 * @returns {Promise<void>}
 */
export async function deletarPedido(pedidoId) {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Erro ao deletar pedido.");

  return response.json();
}