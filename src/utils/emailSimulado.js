// =========================
// SIMULAÇÃO DE ENVIO DE E-MAIL
// =========================
// O projeto usa json-server (sem backend real de e-mail), então o
// código de verificação é exibido em um alert, simulando a chegada
// no e-mail do usuário — assim dá pra testar o fluxo completo.
//
// Para integrar com um serviço real no futuro (EmailJS, Resend,
// SendGrid, ou um backend próprio com Nodemailer), basta reescrever
// esta função. Nenhum outro arquivo precisa mudar.

export async function enviarCodigoPorEmail(email, codigo) {
  console.log(`[SIMULAÇÃO DE E-MAIL] Código para ${email}: ${codigo}`);

  alert(
    `Um código de verificação foi "enviado" para ${email}.\n\n` +
      `(Simulação — em produção isso chegaria por e-mail)\n\n` +
      `Código: ${codigo}`
  );

  return true;
}