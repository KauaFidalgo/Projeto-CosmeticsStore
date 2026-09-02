export function getUsuarioAtual() {
  try {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao ler usuário autenticado:", error);
    return null;
  }
}

export function getUsuarioStorageKey(prefixo) {
  const usuario = getUsuarioAtual();

  const identificador = usuario?.id || usuario?.email || "guest";
  const chave = String(identificador).trim().toLowerCase();

  return `${prefixo}_${chave.replace(/[^a-z0-9_-]/g, "_")}`;
}

export function lerDadosUsuario(prefixo, padrao = []) {
  try {
    const chave = getUsuarioStorageKey(prefixo);
    const valor = localStorage.getItem(chave);

    if (!valor) {
      return Array.isArray(padrao) ? [...padrao] : padrao;
    }

    const dados = JSON.parse(valor);
    return Array.isArray(dados) ? dados : padrao;
  } catch (error) {
    console.error(`Erro ao carregar ${prefixo}:`, error);
    return Array.isArray(padrao) ? [...padrao] : padrao;
  }
}

export function salvarDadosUsuario(prefixo, dados) {
  const chave = getUsuarioStorageKey(prefixo);
  localStorage.setItem(chave, JSON.stringify(dados));
}

export function removerDadosUsuario(prefixo) {
  const chave = getUsuarioStorageKey(prefixo);
  localStorage.removeItem(chave);
}
