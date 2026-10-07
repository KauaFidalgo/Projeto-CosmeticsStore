import {
  FiClock,
  FiCreditCard,
  FiFileText,
  FiMail,
  FiPackage,
  FiUser,
  FiZap,
  FiTrash2,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

import {
  STATUS_PEDIDO,
  formatarData,
  formatarHora,
  formatarMoeda,
  formatarTelefone,
  linkWhatsApp,
  getUsuarioLogado,
  isAdmin,
} from "../../utils/admin";

function resumoPagamento(pedido) {
    const detalhes = pedido?.detalhesPagamento;
  
    if (pedido?.pagamento === "credito") {
      if (!detalhes) return "Cartão de crédito";
  
      return (
        `Crédito • ${detalhes.bandeira || "Cartão"} • ` +
        `${detalhes.numero || "Número não informado"} • ` +
        `Titular: ${detalhes.titular || "Não informado"} • ` +
        `Validade: ${detalhes.validade || "Não informada"} • ` +
        `${detalhes.parcelas || 1}x`
      );
    }
  
    if (pedido?.pagamento === "debito") {
      if (!detalhes) return "Cartão de débito";
  
      return (
        `Débito • ${detalhes.bandeira || "Cartão"} • ` +
        `${detalhes.numero || "Número não informado"} • ` +
        `Titular: ${detalhes.titular || "Não informado"} • ` +
        `Validade: ${detalhes.validade || "Não informada"}`
      );
    }
  
    if (pedido?.pagamento === "boleto") {
      return detalhes?.codigo
        ? `Boleto • Código: ${detalhes.codigo}`
        : "Boleto bancário";
    }
  
    if (pedido?.pagamento === "pix") {
      return detalhes?.codigo
        ? `Pix • Código disponível`
        : "Pagamento via Pix";
    }
  
    return "Pagamento não informado";
}

export default function PedidoCard({ pedido, onAbrir, onDeletar }) {
  const status = STATUS_PEDIDO?.find(
    (s) => s.valor === pedido?.status
  );

  const primeiro = pedido?.itens?.[0];

  const extras = Math.max(
    (pedido?.itens?.length || 1) - 1,
    0
  );

  const whatsapp = linkWhatsApp(
    pedido?.usuario?.telefone
  );

  const IconePagamento =
    pedido?.pagamento === "credito" ||
    pedido?.pagamento === "debito"
      ? FiCreditCard
      : pedido?.pagamento === "boleto"
      ? FiFileText
      : FiZap;

  const usuarioLogado = getUsuarioLogado();
  const podeDeleta = isAdmin(usuarioLogado);

  return (
    <article
      className="pedido-card"
      tabIndex={0}
      role="button"
      onClick={() => onAbrir(pedido)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onAbrir(pedido);
        }
      }}
    >
      {/* TOPO */}
      <div className="pedido-card-top">
        <span className="pedido-data">
          <FiClock />

          {formatarData(pedido?.criadoEm)} às{" "}
          {formatarHora(pedido?.criadoEm)}
        </span>

        <span
          className={`status-badge status-${pedido?.status}`}
        >
          {status?.label || pedido?.status}
        </span>
      </div>

      {/* PRODUTO */}
      <div className="pedido-produto">
        <div className="pedido-thumb">
          {primeiro?.imagem && (
            <img
              src={primeiro.imagem}
              alt={primeiro.nome}
            />
          )}
        </div>

        <div>
          <strong>
            {primeiro?.nome || "Produto"}
          </strong>

          <small>
            {extras > 0
              ? `+ ${extras} outro(s) item(ns)`
              : primeiro?.categoria || "Categoria não informada"}
          </small>
        </div>
      </div>

      {/* CLIENTE */}
      <div className="pedido-cliente">
        <p>
          <FiUser />

          {pedido?.usuario?.nome ||
            "Cliente não informado"}
        </p>

        <p>
          <FiMail />

          {pedido?.usuario?.email ||
            "E-mail não informado"}
        </p>

        {/* WHATSAPP */}
        {whatsapp ? (
          <a
            className="whatsapp-link"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Abrir conversa no WhatsApp"
          >
            <FaWhatsapp />

            {formatarTelefone(
              pedido?.usuario?.telefone
            )}
          </a>
        ) : (
          <p>
            <FaWhatsapp />
            Não informado
          </p>
        )}

        {/* PAGAMENTO */}
        <p>
          <IconePagamento />

          {resumoPagamento(pedido)}
        </p>

        {/* PARCELAS */}
        {(pedido?.pagamento === "credito" ||
          pedido?.pagamento === "debito") &&
          pedido?.detalhesPagamento?.parcelas > 1 && (
            <p>
              <FiCreditCard />

              {pedido.detalhesPagamento.parcelas}x
              {" "}sem juros
            </p>
          )}
      </div>

      {/* RODAPÉ */}
      <div className="pedido-card-bottom">
        <span>
          <FiPackage />

          Pedido #
          {String(pedido?.id || "").slice(0, 6)}
        </span>

        <div className="pedido-card-bottom-right">
          {podeDeleta && (
            <button
              className="pedido-btn-deletar"
              onClick={(e) => {
                e.stopPropagation();
                onDeletar?.(pedido);
              }}
              title="Excluir pedido"
              aria-label="Excluir pedido"
            >
              <FiTrash2 />
            </button>
          )}

          <strong>
            {formatarMoeda(pedido?.total || 0)}
          </strong>
        </div>
      </div>
    </article>
  );
}
