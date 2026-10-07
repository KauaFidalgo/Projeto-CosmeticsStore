export function obterEstoqueDisponivel(produto) {
  if (!produto) return 0;
  return Number(produto.stock_quantity ?? produto.quantidade_estoque ?? 0);
}

export function obterStatusEstoque(produto) {
  const estoqueDisponivel = Math.max(0, obterEstoqueDisponivel(produto));

  if (estoqueDisponivel <= 0) {
    return {
      estoqueDisponivel,
      tipo: "empty",
      label: "Produto indisponível",
      detalhe: "Estoque atual: 0 unidades",
      tooltip: "Estoque atual: 0 unidades | Reservados no carrinho: 0",
      botao: "Produto indisponível",
      chip: "Produto indisponível",
    };
  }

  if (estoqueDisponivel < 5) {
    return {
      estoqueDisponivel,
      tipo: "low",
      label: `Estoque baixo - apenas ${estoqueDisponivel} un.`,
      detalhe: `Restam ${estoqueDisponivel} unidades disponíveis`,
      tooltip: `Estoque atual: ${estoqueDisponivel} unidades | Reservados no carrinho: 0`,
      botao: "Adicionar na sacola",
      chip: `Estoque baixo - ${estoqueDisponivel} un.`,
    };
  }

  return {
    estoqueDisponivel,
    tipo: "ok",
    label: `Em estoque - ${estoqueDisponivel} un.`,
    detalhe: "Disponível para entrega imediata",
    tooltip: `Estoque atual: ${estoqueDisponivel} unidades | Reservados no carrinho: 0`,
    botao: "Adicionar na sacola",
    chip: `Em estoque - ${estoqueDisponivel} un.`,
  };
}
