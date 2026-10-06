const API_URL = "http://localhost:3000";

export async function listarPedidos() {
  const response = await fetch(`${API_URL}/pedidos`);

  if (!response.ok) throw new Error("Erro ao buscar pedidos.");

  const pedidos = await response.json();

  return pedidos.sort(
    (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm),
  );
}

export async function criarPedido(pedido) {
  const response = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });

  if (!response.ok) throw new Error("Erro ao registrar pedido.");

  return response.json();
}

export async function atualizarStatusPedido(id, status) {
  const response = await fetch(`${API_URL}/pedidos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) throw new Error("Erro ao atualizar status.");

  return response.json();
}