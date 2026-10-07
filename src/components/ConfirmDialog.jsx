import { FiX, FiAlertCircle } from "react-icons/fi";
import "./confirm-dialog.css";

export default function ConfirmDialog({
  titulo,
  mensagem,
  textoBotaoConfirmar = "Confirmar",
  textoBotaoCancelar = "Cancelar",
  ehDangeroso = false,
  onConfirmar,
  onCancelar,
  carregando = false,
}) {
  return (
    <div className="confirm-overlay" onClick={onCancelar}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="confirm-close"
          onClick={onCancelar}
          aria-label="Fechar"
        >
          <FiX />
        </button>

        <div className="confirm-header">
          {ehDangeroso && (
            <div className="confirm-icon-alert">
              <FiAlertCircle />
            </div>
          )}
          <h2>{titulo}</h2>
        </div>

        <p className="confirm-mensagem">{mensagem}</p>

        <div className="confirm-actions">
          <button
            className="confirm-btn-cancel"
            onClick={onCancelar}
            disabled={carregando}
          >
            {textoBotaoCancelar}
          </button>

          <button
            className={`confirm-btn-confirm ${
              ehDangeroso ? "confirm-btn-danger" : ""
            }`}
            onClick={onConfirmar}
            disabled={carregando}
          >
            {carregando ? "Processando..." : textoBotaoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
