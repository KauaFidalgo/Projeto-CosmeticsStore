import "./footer.css";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="site-footer">

      <div className="footer-content">

        <div className="footer-brand">
          <strong>SC Medic</strong>
          <p>Beleza, saúde e tecnologia em um só lugar.</p>
        </div>

        <div className="footer-links">

          <div>
            <h4>Empresa</h4>
            <button onClick={() => navigate("/home")}>Sobre nós</button>
            <button onClick={() => navigate("/home")}>Produtos</button>
            <button onClick={() => navigate("/home")}>Contato</button>
          </div>

          <div>
            <h4>Ajuda</h4>
            <button onClick={() => navigate("/home")}>Perguntas frequentes</button>
            <button onClick={() => navigate("/home")}>Trocas e devoluções</button>
            <button onClick={() => navigate("/home")}>Frete e entrega</button>
          </div>

        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} SC Medic. Todos os direitos reservados.
      </div>

    </footer>
  );
}