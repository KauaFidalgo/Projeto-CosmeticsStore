import { describe, it, expect } from "vitest";

import {
  buildFinanceSummary,
  buildMonthlySeries,
  isPedidoPago,
  normalizeProductPayload,
} from "../server.js";

describe("normalização de estoque dos produtos", () => {
  it("mantém valores compatíveis entre stock_quantity e quantidade_estoque", () => {
    const produto = normalizeProductPayload({
      id: "p-1",
      nome: "Serum Vitamina C",
      descricao: "Descrição",
      preco: 89.9,
      stock_quantity: 15,
    });

    expect(produto.stock_quantity).toBe(15);
    expect(produto.quantidade_estoque).toBe(15);
    expect(produto.preco).toBe(89.9);
  });

  it("normaliza valores negativos e ausentes para zero", () => {
    const produto = normalizeProductPayload({
      id: "p-2",
      nome: "Essência",
      descricao: "Essência facial",
      stock_quantity: -5,
    });

    expect(produto.stock_quantity).toBe(0);
    expect(produto.quantidade_estoque).toBe(0);
  });
});

describe("status financeiro dos pedidos", () => {
  it("considera pagamentos concluídos como faturamento válido", () => {
    expect(isPedidoPago({ statusPagamento: "PAGO" })).toBe(true);
    expect(isPedidoPago({ status: "CONCLUIDO" })).toBe(true);
    expect(isPedidoPago({ status: "ENTREGUE" })).toBe(true);
    expect(isPedidoPago({ status: "novo" })).toBe(false);
  });

  it("soma apenas pedidos pagos ou concluídos para bruto e líquido", () => {
    const pedidos = [
      { subtotal: 100, total: 90, statusPagamento: "PAGO" },
      { subtotal: 200, total: 180, status: "CONCLUIDO" },
      { subtotal: 300, total: 250, status: "novo" },
      { subtotal: 50, total: 45, statusPagamento: "PENDENTE" },
    ];

    const resumo = buildFinanceSummary(pedidos);

    expect(resumo.bruto).toBe(300);
    expect(resumo.liquido).toBe(270);
    expect(resumo.quantidadePedidos).toBe(2);
  });
});

describe("dashboard financeiro por mês", () => {
  it("agrega faturamento por mês do mesmo ano e ignora outros anos", () => {
    const pedidos = [
      { total: 100, criadoEm: "2025-01-10T12:00:00.000Z", statusPagamento: "PAGO" },
      { total: 150, criadoEm: "2025-02-05T12:00:00.000Z", statusPagamento: "PAGO" },
      { total: 75, criadoEm: "2025-02-15T12:00:00.000Z", status: "ENTREGUE" },
      { total: 999, criadoEm: "2024-12-20T12:00:00.000Z", statusPagamento: "PAGO" },
    ];

    const series = buildMonthlySeries(2025, pedidos);

    expect(series[0].faturamento).toBe(100);
    expect(series[1].faturamento).toBe(225);
    expect(series[11].faturamento).toBe(0);
    expect(series[0].pedidos).toBe(1);
    expect(series[1].pedidos).toBe(2);
  });
});
