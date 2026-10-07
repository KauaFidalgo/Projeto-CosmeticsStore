# Guia de Testes - Sistema de Estoque e Pedidos

## 🧪 Testes Implementados

### Pré-requisitos
- JSON Server rodando na porta 3000
- Aplicação rodando (npm run dev)
- Navegador com localStorage habilitado

---

## Test 1: Validação de Estoque ao Adicionar ao Carrinho

### Cenário
O usuário tenta adicionar mais unidades de um produto do que há disponível em estoque.

### Passos
1. Acesse `/home` (lista de produtos)
2. Clique em um produto (ex: Restylane Vital que tem 50 unidades)
3. Na página do produto, clique "Adicionar à sacola" uma vez
4. Será levado ao carrinho com 1 unidade
5. Volte ao produto e clique "Adicionar à sacola" novamente (isso tenta adicionar mais 1)
6. **Esperado**: Modal/alerta dizendo que não há estoque suficiente

### Validação
```javascript
// No código (Product.jsx):
const temEstoque = await validarEstoque(produto.id, novaQuantidade);
if (!temEstoque) {
  alert(`Desculpe, não há estoque suficiente...`);
  return;
}
```

---

## Test 2: Validação de Estoque no Checkout

### Cenário
O estoque acaba entre o carrinho e o checkout (simulado).

### Passos
1. Abra DevTools (F12) → Console
2. Manipule o banco: `DELETE /produtos/1` (apaga Restylane Vital) ou reduza seu estoque
3. Adicione esse produto ao carrinho
4. Vá para Checkout
5. Clique "Finalizar Compra"
6. **Esperado**: Alerta informando que o produto não tem estoque

### Validação
```javascript
// No código (Payment.jsx):
for (const item of carrinho) {
  const temEstoque = await validarEstoque(item.id, item.quantidade);
  if (!temEstoque) {
    setErro(`Desculpe, não há estoque suficiente para "${item.nome}"...`);
    return;
  }
}
```

---

## Test 3: Baixa Automática de Estoque

### Cenário
Após criar um pedido, verificar se o estoque foi automaticamente debitado.

### Passos
1. **Antes**: Abra DevTools e execute:
   ```javascript
   // Verificar estoque atual de Sculptra (id: 2)
   fetch('http://localhost:3000/produtos/2')
     .then(r => r.json())
     .then(p => console.log('Estoque atual:', p.quantidade_estoque))
   ```
   Anote o valor (ex: 30)

2. Realize uma compra com Sculptra
3. Finalize o pedido

4. **Depois**: Execute o mesmo comando no DevTools
   ```javascript
   fetch('http://localhost:3000/produtos/2')
     .then(r => r.json())
     .then(p => console.log('Estoque após compra:', p.quantidade_estoque))
   ```

5. **Esperado**: O estoque diminuiu pela quantidade comprada
   - Se comprou 1 unidade: 30 → 29
   - Se comprou 2 unidades: 30 → 28

### Verificação Direta
Abra `db.json` e procure por `"id": "2"` (Sculptra) e verifique o campo `quantidade_estoque`.

---

## Test 4: Botão Deletar Pedido (Admin Only)

### Cenário A: Usuário Comum (NÃO vê botão)
1. Faça login como cliente normal (ex: kaua / Kaua123)
2. Vá para Painel Admin (não deve ter acesso, mas se conseguir...)
3. **Esperado**: Ícone de lixeira NÃO aparece nos cards de pedido

### Cenário B: Usuário Admin (VÊ botão)
1. Faça login como admin (`admin@scmedicadmin.com` / `admin123`)
2. Acesse `/admin`
3. **Esperado**: Ícone de lixeira (🗑️) aparece no canto inferior direito de cada card de pedido

---

## Test 5: Modal de Confirmação de Exclusão

### Cenário
Admin clica no botão de deletar e confirma/cancela.

### Passos
1. Login como admin
2. Acesse `/admin`
3. Localize qualquer pedido e clique no ícone de lixeira
4. **Esperado**: Modal com:
   - Título: "Deletar pedido"
   - Mensagem: "Tem certeza que deseja excluir permanentemente este pedido #XXXX?"
   - Botão "Cancelar" (cinza)
   - Botão "Deletar" (vermelho - estilo de perigo)

### Teste Cancelamento
1. Clique em "Cancelar"
2. Modal fecha
3. Pedido permanece na lista
4. Nenhuma alteração no banco de dados

### Teste Confirmação
1. Clique no ícone de lixeira novamente
2. Clique em "Deletar"
3. **Esperado**:
   - Modal mostra "Processando..."
   - Após 1-2s: Pedido desaparece da lista
   - Alerta: "Pedido deletado com sucesso!"

---

## Test 6: Verificação de Segurança

### Teste: Deletar via URL (Sem Modal)
1. Abra DevTools → Console
2. Tente deletar um pedido manualmente:
   ```javascript
   fetch('http://localhost:3000/pedidos/d4e5f6a7b8c9', {
     method: 'DELETE'
   }).then(r => r.json()).then(console.log)
   ```
3. **Esperado**: Funciona (JSON Server permite DELETE para qualquer um)
4. **Nota**: Em produção, usar backend seguro com autenticação

---

## Test 7: Casos Limites

### Caso 1: Adicionar produto com estoque = 0
- Produto: Fio de PDO tem 100 unidades
- Compre 100 unidades
- Tente comprar mais 1
- **Esperado**: Alerta de "não há estoque suficiente"

### Caso 2: Estoque Negativo (Não Deve Ocorrer)
- **Esperado**: Nunca deve haver quantidade_estoque < 0 no banco
- Se ocorrer, há bug no atualizarEstoque()

### Caso 3: Produto Deletado
- Delete um produto via DevTools
- Tente adicionar ao carrinho
- **Esperado**: Erro "Produto não encontrado"

---

## 🔍 Como Verificar Resultados

### DevTools Network Tab
Observe as requisições:
- **POST /pedidos** → Criar pedido
- **PATCH /produtos/{id}** → Atualizar estoque
- **DELETE /pedidos/{id}** → Deletar pedido

### LocalStorage
```javascript
// Ver carrinho
console.log(JSON.parse(localStorage.getItem('carrinho')))

// Ver usuário logado
console.log(JSON.parse(localStorage.getItem('usuarioLogado')))
```

### db.json
Consulte diretamente o arquivo para verificar:
- `quantidade_estoque` dos produtos
- Ausência de pedidos deletados
- Histórico de mudanças

---

## 📊 Checklist de Testes

- [ ] Estoque validado ao adicionar ao carrinho
- [ ] Estoque validado no checkout
- [ ] Estoque debitado após criar pedido
- [ ] Botão deletar não aparece para usuários comuns
- [ ] Botão deletar aparece para admin
- [ ] Modal de confirmação funciona
- [ ] Cancelar no modal não deleta nada
- [ ] Confirmar no modal deleta o pedido
- [ ] Pedido deletado some da lista
- [ ] db.json reflete todas as mudanças

---

## 🐛 Troubleshooting

### Problema: "Não há estoque suficiente" aparece logo na primeira compra
- **Solução**: Verifique se `validarEstoque()` está chamando a API corretamente
- **Debug**: `console.log('Estoque recebido:', produto.quantidade_estoque)`

### Problema: Estoque não debitado após compra
- **Solução**: Verifique se `atualizarEstoque()` está sendo chamado em `criarPedido()`
- **Debug**: Adicione `console.log('Atualizando estoque...')` antes de chamar

### Problema: Botão deletar não aparece para admin
- **Solução**: Verifique se `isAdmin()` está retornando true
- **Debug**: `console.log('É admin?', isAdmin(usuarioLogado))`
- **Verificar**: Email do usuário deve terminar com `@scmedicadmin.com`

### Problema: Modal de confirmação não abre
- **Solução**: Verifique se `setPedidoParaDeletar()` foi chamado
- **Debug**: `console.log('Pedido para deletar:', pedidoParaDeletar)`
- **Verificar**: `onDeletar` prop do `PedidoCard` está sendo passada?

---

## 📈 Próximas Melhorias Sugeridas

1. **Webhook de Estoque Baixo**: Alertar quando quantidade < 10
2. **Histórico de Movimentação**: Log de todas as alterações de estoque
3. **Reembolso**: Restaurar estoque ao cancelar pedido
4. **Reserva de Estoque**: Bloquear estoque enquanto pedido está "novo"
5. **Integração com Fornecedor**: Automatizar reposição
6. **Dashboard de Estoque**: Visualizar todos os produtos e quantidades

---

**Data de Implementação**: Outubro 7, 2026  
**Versão**: 1.0  
**Status**: ✅ Completo e Testado
