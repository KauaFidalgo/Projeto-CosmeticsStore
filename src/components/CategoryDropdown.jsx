import "./category-dropdown.css";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck, FiSliders } from "react-icons/fi";

export default function CategoryDropdown({
  categorias,
  selecionado,
  onSelecionar,
}) {
  const [aberto, setAberto] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () =>
      document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function selecionar(valor) {
    onSelecionar(valor);
    setAberto(false);
  }

  const categoriaAtual = categorias.find(
    (categoria) => categoria.valor === selecionado
  );

  return (
    <div className="category-dropdown" ref={dropdownRef}>

      <button
        className={
          aberto
            ? "category-dropdown-button open"
            : "category-dropdown-button"
        }
        onClick={() => setAberto(!aberto)}
      >
        <FiSliders className="category-dropdown-icon" />

        <span className="category-dropdown-label">
          {categoriaAtual?.nome || "Categorias"}
        </span>

        <FiChevronDown className="category-dropdown-chevron" />
      </button>

      {aberto && (
        <div className="category-dropdown-menu">

          {categorias.map((categoria) => (

            <button
              key={categoria.valor}
              className={
                selecionado === categoria.valor
                  ? "category-dropdown-item active"
                  : "category-dropdown-item"
              }
              onClick={() => selecionar(categoria.valor)}
            >
              {categoria.nome}

              {selecionado === categoria.valor && <FiCheck />}
            </button>

          ))}

        </div>
      )}

    </div>
  );
}