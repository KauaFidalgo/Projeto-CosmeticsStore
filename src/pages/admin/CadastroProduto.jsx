import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUpload, FiCheck, FiAlertCircle, FiLoader } from "react-icons/fi";
import "./cadastro-produto.css";
import { criarProduto } from "../../services/produtosService";

export default function CadastroProduto() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    precoAntigo: "",
    quantidade_estoque: "",
    categoria: "Preenchedor",
    imagens: [],
  });

  const [previews, setPreviews] = useState([]);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [notificacao, setNotificacao] = useState(null);

  // Formatar valor como moeda
  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // Desformatar moeda para número
  function desformatarMoeda(valor) {
    if (!valor) return 0;
    const somenteNumeros = String(valor).replace(/[^\d,.-]/g, "");
    const valorLimpo = somenteNumeros.replace(".", "").replace(",", ".");
    const numero = Number(valorLimpo);
    return Number.isFinite(numero) ? numero : 0;
  }

  // Handle de mudança no input de preço
  function handlePrecoChange(e, campo) {
    const raw = e.target.value.replace(/[^\d]/g, "");
    const numerico = raw ? Number(raw) / 100 : 0;
    const formatado = numerico.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    setFormData(prev => ({
      ...prev,
      [campo]: formatado
    }));
  }

  // Handle de mudança em input de quantidade
  function handleQuantidadeChange(e) {
    const valor = e.target.value.replace(/\D/g, "");
    setFormData(prev => ({
      ...prev,
      quantidade_estoque: valor ? Number(valor) : ""
    }));
  }

  // Handle de upload de imagens
  function handleImagemUpload(e) {
    const files = Array.from(e.target.files);

    if (files.length + formData.imagens.length > 3) {
      mostrarNotificacao("Máximo de 3 imagens permitidas", "erro");
      return;
    }

    const novasPreviews = files.map(file => URL.createObjectURL(file));
    const novasImagens = files;

    setPreviews(prev => [...prev, ...novasPreviews]);
    setFormData(prev => ({
      ...prev,
      imagens: [...prev.imagens, ...novasImagens]
    }));

    // Limpar erro de imagens
    if (erros.imagens) {
      setErros(prev => ({ ...prev, imagens: "" }));
    }
  }

  // Remover imagem
  function removerImagem(index) {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));
  }

  // Mostrar notificação
  function mostrarNotificacao(mensagem, tipo = "sucesso") {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => setNotificacao(null), 4000);
  }

  // Validar formulário
  function validarFormulario() {
    const novosErros = {};

    if (!formData.nome.trim()) novosErros.nome = "Nome é obrigatório";
    if (!formData.descricao.trim()) novosErros.descricao = "Descrição é obrigatória";
    if (!formData.preco || formData.preco === "R$ 0,00") novosErros.preco = "Preço é obrigatório";
    if (!formData.quantidade_estoque && formData.quantidade_estoque !== 0) novosErros.quantidade_estoque = "Estoque é obrigatório";
    if (formData.imagens.length === 0 || formData.imagens.length > 3) novosErros.imagens = "Adicione entre 1 e 3 imagens";

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  // Enviar formulário
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validarFormulario()) {
      mostrarNotificacao("Verifique os erros no formulário", "erro");
      return;
    }

    setEnviando(true);

    try {
      // Criar FormData para upload
      const dados = new FormData();
      
      // ========== CONVERSÃO DEFENSIVA DE TIPOS ==========
      // Garantir que valores numéricos sejam enviados corretamente
      const precoNumerico = Number(desformatarMoeda(formData.preco));
      const precoAntigoNumerico = formData.precoAntigo 
        ? Number(desformatarMoeda(formData.precoAntigo))
        : precoNumerico;
      const quantidadeNumerico = Number(formData.quantidade_estoque);
      
      dados.append("nome", String(formData.nome).trim());
      dados.append("descricao", String(formData.descricao).trim());
      dados.append("preco", String(precoNumerico));
      dados.append("precoAntigo", String(precoAntigoNumerico));
      dados.append("quantidade_estoque", String(quantidadeNumerico));
      dados.append("categoria", String(formData.categoria).trim());
      dados.append("status", "Ativo");
      dados.append("visivel", "true");
      dados.append("avaliacao", "4.5");
      dados.append("desconto", "0");

      // Adicionar imagens
      formData.imagens.forEach((imagem, index) => {
        dados.append(`imagem_${index + 1}`, imagem);
      });

      // ========== ENVIO COM TRATAMENTO ROBUSTO DE ERRO ==========
      const novoProduto = await criarProduto(dados);

      console.log("Produto criado com sucesso:", novoProduto);
      mostrarNotificacao("Produto publicado com sucesso!", "sucesso");

      // Limpar form após 2s e voltar
      setTimeout(() => {
        navigate("/admin");
      }, 1800);
    } catch (erro) {
      console.error("Erro completo:", erro);
      
      // ========== EXIBIÇÃO DE ERRO AMIGÁVEL ==========
      let mensagemErro = "Erro ao publicar produto. Tente novamente.";
      
      if (erro instanceof Error) {
        // Se for erro de rede
        if (!navigator.onLine) {
          mensagemErro = "Sem conexão com a internet. Verifique sua conexão.";
        }
        // Se for erro específico do servidor
        else if (erro.status === 500) {
          mensagemErro = "Erro no servidor. Verifique os dados e tente novamente.";
        }
        // Se for erro de validação
        else if (erro.status === 400) {
          mensagemErro = `Dados inválidos: ${erro.message}`;
        }
        // Se for erro customizado
        else if (erro.message) {
          mensagemErro = erro.message;
        }
      }
      
      mostrarNotificacao(mensagemErro, "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cadastro-produto-page">
      {/* Header */}
      <header className="cadastro-header">
        <button className="btn-voltar" onClick={() => navigate("/admin")}>
          <FiArrowLeft />
          Voltar ao Painel
        </button>
        <h1>Cadastrar Novo Produto</h1>
        <div style={{ width: "120px" }} />
      </header>

      {/* Notificação */}
      {notificacao && (
        <div className={`notificacao notificacao-${notificacao.tipo}`}>
          <div className="notificacao-icone">
            {notificacao.tipo === "sucesso" ? <FiCheck /> : <FiAlertCircle />}
          </div>
          <p>{notificacao.mensagem}</p>
        </div>
      )}

      {/* Container Principal */}
      <div className="cadastro-container">
        <form onSubmit={handleSubmit} className="formulario-cadastro">
          {/* Seção: Upload de Imagens */}
          <section className="secao-formulario">
            <h2>Fotos do Produto</h2>
            <p className="secao-descricao">Adicione exatamente 3 fotos (máximo 10MB cada)</p>

            <div className="upload-area">
              <input
                type="file"
                id="upload-imagens"
                accept="image/*"
                multiple
                onChange={handleImagemUpload}
                disabled={formData.imagens.length >= 3}
                className="upload-input"
              />
              <label htmlFor="upload-imagens" className={`upload-label ${formData.imagens.length >= 3 ? 'disabled' : ''}`}>
                <FiUpload />
                <span>Clique para selecionar ou arraste imagens aqui</span>
                <small>{formData.imagens.length}/3 imagens</small>
              </label>
            </div>

            {/* Preview de Imagens */}
            <div className="preview-container">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="btn-remover-imagem"
                    onClick={() => removerImagem(index)}
                    aria-label="Remover imagem"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {erros.imagens && (
              <div className="erro-campo">
                <FiAlertCircle />
                {erros.imagens}
              </div>
            )}
          </section>

          {/* Seção: Informações Básicas */}
          <section className="secao-formulario">
            <h2>Informações Básicas</h2>

            <div className="grupo-campo">
              <label htmlFor="nome">Nome do Produto *</label>
              <input
                type="text"
                id="nome"
                placeholder="Ex: Restylane Vital"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className={erros.nome ? "erro" : ""}
              />
              {erros.nome && (
                <div className="erro-campo">
                  <FiAlertCircle />
                  {erros.nome}
                </div>
              )}
            </div>

            <div className="grupo-campo">
              <label htmlFor="descricao">Descrição Detalhada *</label>
              <textarea
                id="descricao"
                placeholder="Descreva as características, benefícios e instruções de uso do produto..."
                rows="6"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                className={erros.descricao ? "erro" : ""}
              />
              {erros.descricao && (
                <div className="erro-campo">
                  <FiAlertCircle />
                  {erros.descricao}
                </div>
              )}
            </div>

            <div className="grupo-campo">
              <label htmlFor="categoria">Categoria *</label>
              <select
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
              >
                <option value="Preenchedor">Preenchedor</option>
                <option value="Bioestimulador">Bioestimulador</option>
                <option value="Toxina Botulínica">Toxina Botulínica</option>
                <option value="Skinbooster">Skinbooster</option>
                <option value="Fio de PDO">Fio de PDO</option>
              </select>
            </div>
          </section>

          {/* Seção: Precificação e Estoque */}
          <section className="secao-formulario">
            <h2>Precificação e Estoque</h2>

            <div className="row-dupla">
              <div className="grupo-campo">
                <label htmlFor="preco">Preço de Venda *</label>
                <input
                  type="text"
                  id="preco"
                  placeholder="R$ 0,00"
                  value={formData.preco}
                  onChange={(e) => handlePrecoChange(e, "preco")}
                  className={erros.preco ? "erro" : ""}
                />
                {erros.preco && (
                  <div className="erro-campo">
                    <FiAlertCircle />
                    {erros.preco}
                  </div>
                )}
              </div>

              <div className="grupo-campo">
                <label htmlFor="precoAntigo">Preço Original (Opcional)</label>
                <input
                  type="text"
                  id="precoAntigo"
                  placeholder="R$ 0,00"
                  value={formData.precoAntigo}
                  onChange={(e) => handlePrecoChange(e, "precoAntigo")}
                />
              </div>
            </div>

            <div className="grupo-campo">
              <label htmlFor="quantidade_estoque">Estoque Disponível *</label>
              <input
                type="text"
                id="quantidade_estoque"
                placeholder="0"
                value={formData.quantidade_estoque}
                onChange={handleQuantidadeChange}
                className={erros.quantidade_estoque ? "erro" : ""}
              />
              {erros.quantidade_estoque && (
                <div className="erro-campo">
                  <FiAlertCircle />
                  {erros.quantidade_estoque}
                </div>
              )}
            </div>
          </section>

          {/* Botão de Ação */}
          <div className="acoes-formulario">
            <button
              type="button"
              className="btn-secundario"
              onClick={() => navigate("/admin")}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primario"
              disabled={enviando}
            >
              {enviando ? (
                <>
                  <FiLoader className="spinner" />
                  Publicando...
                </>
              ) : (
                <>
                  <FiCheck />
                  Salvar Produto
                </>
              )}
            </button>
          </div>
        </form>

        {/* Resumo do Produto (Preview) */}
        <aside className="preview-produto">
          <h3>Preview do Produto</h3>
          <div className="preview-card">
            {previews.length > 0 && (
              <div className="preview-imagem">
                <img src={previews[0]} alt="Preview" />
              </div>
            )}
            <div className="preview-info">
              <h4>{formData.nome || "Nome do Produto"}</h4>
              <p className="preview-descricao">
                {formData.descricao || "Descrição do produto aparecerá aqui"}
              </p>
              <div className="preview-footer">
                <span className="preview-categoria">{formData.categoria}</span>
                <strong className="preview-preco">
                  {formData.preco || "R$ 0,00"}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
