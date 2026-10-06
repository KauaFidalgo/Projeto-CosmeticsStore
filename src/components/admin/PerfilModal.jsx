import { useEffect } from "react";
import { FiMail, FiShield, FiUser, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

import { formatarTelefone, linkWhatsApp } from "../../utils/admin";

export default function PerfilModal({ usuario, onFechar }) {
  useEffect(() => {
    function fecharComEsc(e) {
      if (e.key === "Escape") onFechar();
    }

    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [onFechar]);

  const whatsapp = linkWhatsApp(usuario.telefone);

  return (
    <div className="admin-overlay" onClick={onFechar}>
      <div
        className="admin-modal admin-modal-small"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onFechar} aria-label="Fechar">
          <FiX />
        </button>

        <div className="perfil-avatar">
          <FiUser />
        </div>

        <h2 className="perfil-nome">{usuario.nome}</h2>

        <span className="perfil-role">
          <FiShield />
          Administrador
        </span>

        <div className="perfil-info">
          <p>
            <FiMail />
            {usuario.email}
          </p>

          {whatsapp ? (
            <a
              className="whatsapp-link"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <FaWhatsapp />
              {formatarTelefone(usuario.telefone)}
            </a>
          ) : (
            <p>
              <FaWhatsapp />
              Não informado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}