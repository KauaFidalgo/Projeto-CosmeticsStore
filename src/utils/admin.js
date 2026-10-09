export const ADMIN_DOMAIN = "@scmedicadmin.com";
export const ADMIN_EMAILS = new Set([
  "admin@scmedicadmin.com",
  "admin@gmail.com",
  "admin@scmedic.com",
]);

export const STATUS_PEDIDO = [
  { valor: "novo", label: "Novo" },
  { valor: "separacao", label: "Em separação" },
  { valor: "enviado", label: "Enviado" },
  { valor: "entregue", label: "Entregue" },
];

export const FORMAS_PAGAMENTO = {
  pix: "Pix",
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  boleto: "Boleto",
};

export function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado"));
  } catch {
    return null;
  }
}

export function isAdmin(usuario) {
  if (!usuario || typeof usuario !== "object") return false;

  const email = String(usuario.email || "").trim().toLowerCase();
  const role = String(usuario.role || usuario.perfil || "").trim().toUpperCase();

  return Boolean(
    usuario?.isAdmin === true ||
    usuario?.admin === true ||
    usuario?.id === "admin-001" ||
    role === "ADMIN" ||
    email.endsWith(ADMIN_DOMAIN) ||
    ADMIN_EMAILS.has(email),
  );
}

export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarTelefone(telefone) {
  const n = String(telefone || "").replace(/\D/g, "");

  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;

  return telefone || "Não informado";
}

export function linkWhatsApp(telefone) {
  let n = String(telefone || "").replace(/\D/g, "");

  if (!n) return null;
  if (!n.startsWith("55") && n.length <= 11) n = `55${n}`;

  return `https://wa.me/${n}`;
}