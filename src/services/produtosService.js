const API_URL = "http://localhost:3000";

/**
 * Lista todos os produtos
 */
export async function listarProdutos() {
  try {
    const response = await fetch(`${API_URL}/produtos`);
    if (!response.ok) throw new Error("Erro ao buscar produtos");
    return await response.json();
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    throw error;
  }
}

/**
 * Busca um produto por ID
 */
export async function buscarProduto(id) {
  try {
    const response = await fetch(`${API_URL}/produtos/${id}`);
    if (!response.ok) throw new Error("Produto não encontrado");
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    throw error;
  }
}

/**
 * Cria um novo produto
 * @param {FormData} formData - Dados do formulário
 */
export async function criarProduto(formData) {
  try {
    const payload = {
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      preco: Number(formData.get("preco") || 0),
      precoAntigo: Number(formData.get("precoAntigo") || 0),
      quantidade_estoque: Number(formData.get("quantidade_estoque") || 0),
      categoria: formData.get("categoria") || "Preenchedor",
      status: formData.get("status") || "Ativo",
      visivel: formData.get("visivel") === "true",
      avaliacao: Number(formData.get("avaliacao") || 4.5),
      desconto: Number(formData.get("desconto") || 0),
      imagem: "/images/restylane.png",
      imagens: ["/images/restylane.png"],
    };

    const response = await fetch(`${API_URL}/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = "Erro ao criar produto";
      const contentType = response.headers.get("content-type") || "";

      try {
        if (contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        }
      } catch (parseError) {
        console.warn("Não foi possível ler a mensagem de erro:", parseError);
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Resposta do servidor não é JSON válido");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    throw error;
  }
}

/**
 * Atualiza um produto existente
 */
export async function atualizarProduto(id, dados) {
  try {
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!response.ok) throw new Error("Erro ao atualizar produto");
    return await response.json();
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    throw error;
  }
}

/**
 * Deleta um produto
 */
export async function deletarProduto(id) {
  try {
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Erro ao deletar produto");
    return await response.json();
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    throw error;
  }
}
