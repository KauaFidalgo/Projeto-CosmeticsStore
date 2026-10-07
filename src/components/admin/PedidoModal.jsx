import { useEffect, useState } from "react";
import {
  FiCheck,
  FiCopy,
  FiCreditCard,
  FiFileText,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

import {
  FORMAS_PAGAMENTO,
  STATUS_PEDIDO,
  formatarData,
  formatarHora,
  formatarMoeda,
  formatarTelefone,
  linkWhatsApp,
} from "../../utils/admin";

function obterStatusEstoqueItem(item) {
  const estoque = Number(item?.estoqueRestanteAtual ?? item?.estoqueAtual ?? 0);
  const quantidade = Number(item?.quantidade ?? 0);

  if (estoque <= 0) {
    return {
      tipo: "empty",
      texto: "Esgotado / 0 un.",
    };
  }

  if (estoque < quantidade) {
    return {
      tipo: "low",
      texto: `Baixo - ${estoque} un. restantes`,
    };
  }

  return {
    tipo: "ok",
    texto: `Em estoque - ${estoque} un.`,
  };
}

export default function PedidoModal({ pedido, onFechar, onStatus }) {
  const [copiado, setCopiado] = useState("");

  useEffect(() => {
    function fecharComEsc(e) {
      if (e.key === "Escape") onFechar();
    }

    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [onFechar]);

  async function copiar(chave, texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(""), 2000);
    } catch (error) {
      console.error(error);
    }
  }

  const whatsapp = linkWhatsApp(pedido.usuario?.telefone);
  const endereco = typeof pedido.endereco === "string" ? pedido.endereco : "";

  const detalhes = pedido.detalhesPagamento;
  const metodo = FORMAS_PAGAMENTO[pedido.pagamento] || pedido.pagamento;

  const ehCartao =
    pedido.pagamento === "credito" || pedido.pagamento === "debito";

  const IconePagamento = ehCartao
    ? FiCreditCard
    : pedido.pagamento === "boleto"
      ? FiFileText
      : FiZap;

  const numeroCartao = detalhes?.numero || `•••• •••• •••• ${detalhes?.final}`;

  return (
    <div className="admin-overlay" onClick={onFechar}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onFechar} aria-label="Fechar">
          <FiX />
        </button>

        <span className="admin-eyebrow">
          Pedido #{String(pedido.id).slice(0, 6)}
        </span>

        <h2>Detalhes do pedido</h2>

        <p className="modal-sub">
          Realizado em {formatarData(pedido.criadoEm)} às{" "}
          {formatarHora(pedido.criadoEm)}
        </p>

        <div className="modal-section">
          <h3>Produtos</h3>

          {pedido.itens?.map((item) => {
            const estoqueInfo = obterStatusEstoqueItem(item);

            return (
              <div className="modal-item" key={`${item.id}-${item.nome}`}>
                <div className="modal-item-image">
                  <img src={item.imagem} alt={item.nome} />
                </div>

                <div className="modal-item-info">
                  <strong>{item.nome}</strong>
                  <span className="modal-tag">{item.categoria}</span>

                  {item.descricao && <p>{item.descricao}</p>}

                  <div className="modal-item-price">
                    <span>
                      {item.quantidade}x {formatarMoeda(item.preco)}
                    </span>

                    <strong>{formatarMoeda(item.preco * item.quantidade)}</strong>
                  </div>

                  <div className={`modal-stock-panel stock-${estoqueInfo.tipo}`} title={`Estoque atual: ${item.estoqueRestanteAtual ?? item.estoqueAtual ?? 0} un. | Reservados neste pedido: ${item.quantidadeReservadaNoPedido ?? item.quantidade ?? 0}`}>
                    <small>{estoqueInfo.texto}</small>
                    <small>
                      Reservado neste pedido: {item.quantidadeReservadaNoPedido ?? item.quantidade ?? 0} un.
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-section">
          <h3>Cliente</h3>

          <div className="modal-grid">
            <div>
              <small>Nome</small>
              <strong>{pedido.usuario?.nome}</strong>
            </div>

            <div>
              <small>E-mail</small>
              <strong>{pedido.usuario?.email}</strong>
            </div>

            <div>
              <small>Telefone</small>

              {whatsapp ? (
                <a
                  className="whatsapp-link"
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaWhatsapp />
                  {formatarTelefone(pedido.usuario?.telefone)}
                </a>
              ) : (
                <strong>Não informado</strong>
              )}
            </div>
          </div>

          {endereco && <p className="modal-address">{endereco}</p>}
        </div>

        <div className="modal-section">
          <h3>Detalhes do pagamento</h3>

          <div className="pay-details">
            <div className={`pay-type pay-type-${pedido.pagamento}`}>
              <span className="pay-type-icon">
                <IconePagamento />
              </span>

              <div>
                <small>Forma de pagamento</small>
                <strong>{metodo}</strong>
              </div>

              {ehCartao && detalhes?.bandeira && (
                <span className="pay-brand">{detalhes.bandeira}</span>
              )}
            </div>

            {ehCartao && detalhes && (
              <>
                <div className="pay-facts">
                  <div>
                    <small>Titular</small>
                    <strong>{detalhes.titular}</strong>
                  </div>

                  <div>
                    <small>Validade</small>
                    <strong>{detalhes.validade}</strong>
                  </div>

                  <div>
                    <small>Bandeira</small>
                    <strong>{detalhes.bandeira}</strong>
                  </div>

                  {pedido.pagamento === "credito" && (
                    <div>
                      <small>Parcelas</small>
                      <strong>
                        {detalhes.parcelas > 1
                          ? `${detalhes.parcelas}x de ${formatarMoeda(
                              pedido.total / detalhes.parcelas,
                            )} sem juros`
                          : "À vista"}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="pay-code">
                  <div>
                    <small>Número do cartão de teste</small>
                    <strong>{numeroCartao}</strong>
                  </div>

                  {detalhes.numero && (
                    <button onClick={() => copiar("cartao", detalhes.numero)}>
                      {copiado === "cartao" ? <FiCheck /> : <FiCopy />}
                      {copiado === "cartao" ? "Copiado!" : "Copiar"}
                    </button>
                  )}
                </div>

                <p className="modal-note">
                  {detalhes.numero
                    ? "Ambiente de teste: número fictício salvo no banco de dados. O CVV nunca é armazenado."
                    : "Por segurança, somente os 4 últimos dígitos são armazenados. O CVV nunca é armazenado."}
                </p>
              </>
            )}

            {pedido.pagamento === "boleto" && detalhes && (
              <div className="boleto-box">
                <div className="pay-facts">
                  <div>
                    <small>Vencimento</small>
                    <strong>{formatarData(detalhes.vencimento)}</strong>
                  </div>

                  <div>
                    <small>Valor do documento</small>
                    <strong>{formatarMoeda(pedido.total)}</strong>
                  </div>
                </div>

                <div className="boleto-barras" aria-hidden="true" />

                <div className="pay-code">
                  <div>
                    <small>Linha digitável</small>
                    <strong>{detalhes.codigo}</strong>
                  </div>

                  <button onClick={() => copiar("boleto", detalhes.codigo)}>
                    {copiado === "boleto" ? <FiCheck /> : <FiCopy />}
                    {copiado === "boleto" ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            {/* PIX */}

            {pedido.pagamento === "pix" && detalhes && (
              <>
                <div className="pay-facts">
                  <div>
                    <small>Expira em</small>
                    <strong>
                      {formatarData(detalhes.expiraEm)} às{" "}
                      {formatarHora(detalhes.expiraEm)}
                    </strong>
                  </div>

                  <div>
                    <small>Desconto Pix</small>
                    <strong className="pink">
                      {pedido.desconto > 0
                        ? `- ${formatarMoeda(pedido.desconto)}`
                        : formatarMoeda(0)}
                    </strong>
                  </div>
                </div>

                <div className="pay-code">
                  <div>
                    <small>Código Pix</small>
                    <strong>{detalhes.codigo}</strong>
                  </div>

                  <button onClick={() => copiar("pix", detalhes.codigo)}>
                    {copiado === "pix" ? <FiCheck /> : <FiCopy />}
                    {copiado === "pix" ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </>
            )}

            {/* PEDIDOS ANTIGOS, SEM DETALHES */}

            {!detalhes && (
              <p className="modal-note">
                Os detalhes deste pagamento não foram registrados no pedido.
              </p>
            )}
          </div>
        </div>

        <div className="modal-section">
          <h3>Status do pedido</h3>

          <div className="modal-status">
            <label htmlFor="status-pedido-admin">Atualizar status manualmente</label>
            <select
              id="status-pedido-admin"
              value={pedido.status || "novo"}
              onChange={(event) => onStatus?.(pedido.id, event.target.value)}
            >
              {STATUS_PEDIDO.map((status) => (
                <option key={status.valor} value={status.valor}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}