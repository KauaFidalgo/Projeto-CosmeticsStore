// =========================
// HELPERS DE ENDEREÇO
// =========================
// Usado tanto no Perfil quanto no Checkout (Identification), já que
// os dois trabalham com o MESMO endereço salvo em `usuarios` no db.json.

export const enderecoVazio = {
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export function enderecoValido(endereco) {
  if (!endereco) return false;

  return Boolean(
    endereco.cep?.trim() &&
      endereco.rua?.trim() &&
      endereco.numero?.trim() &&
      endereco.bairro?.trim() &&
      endereco.cidade?.trim() &&
      endereco.estado?.trim()
  );
}

export function formatarEndereco(endereco) {
  if (!endereco) return "";

  const { rua, numero, bairro, cidade, estado } = endereco;

  if (!rua && !cidade) return "";

  const partes = [
    rua && numero ? `${rua}, ${numero}` : rua,
    bairro,
    cidade && estado ? `${cidade} - ${estado}` : cidade,
  ].filter(Boolean);

  return partes.join(", ");
}