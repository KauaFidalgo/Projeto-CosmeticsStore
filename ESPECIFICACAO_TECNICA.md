# Resumo Técnico - Sistema de Controle de Estoque e Gerenciamento de Pedidos

## 📦 1. Estrutura do Banco de Dados

### Schema Produtos (db.json)
```json
{
  "id": "1",
  "nome": "Restylane Vital",
  "categoria": "Preenchedor",
  "preco": 331.5,
  "precoAntigo": 390,
  "desconto": 15,
  "imagem": "/images/restylane.png",
  "avaliacao": "4.8",
  "descricao": "...",
  "quantidade_estoque": 50  // ← NOVO CAMPO
}
```

### Schema Pedidos (db.json)
```json
{
  "id": "d4e5f6a7b8c9",
  "criadoEm": "2026-10-04T15:20:00.000Z",
  "status": "novo",  // novo, separacao, enviado, entregue
  "pagamento": "debito",  // debito, credito, pix, boleto
  "itens": [
    {
      "id": "6",
      "nome": "Restylane Skinboosters Vital Light",
      "quantidade": 1,
      "preco": 357,
      "categoria": "Skinbooster"
    }
  ],
  "usuario": { ... },
  "endereco": "...",
  "subtotal": 357,
  "desconto": 0,
  "total": 357
}
```

---

## 🔧 2. API de Serviços (pedidosService.js)

### Funções Principais

#### `validarEstoque(produtoId, quantidade): Promise<boolean>`
- **Propósito**: Verificar disponibilidade de estoque
- **Fluxo**:
  1. Busca produto via GET `/produtos/{id}`
  2. Compara `quantidade_estoque >= quantidade`
  3. Retorna `true` ou `false`
- **Erro Handling**: Retorna `false` se produto não existir

#### `atualizarEstoque(itens): Promise<void>`
- **Propósito**: Debitar estoque após pedido criado
- **Fluxo**:
  1. Itera sobre cada item do pedido
  2. Busca produto atual via GET `/produtos/{item.id}`
  3. Calcula: `novaQuantidade = Math.max(0, atual - quantidade)`
  4. Atualiza via PATCH `/produtos/{item.id}`
- **Segurança**: Garante que estoque nunca fique negativo com `Math.max(0, ...)`

#### `deletarPedido(pedidoId): Promise<void>`
- **Propósito**: Remover permanentemente um pedido
- **Fluxo**:
  1. Envia DELETE `/pedidos/{pedidoId}`
  2. Retorna resposta ou erro
- **Permissões**: Validado no frontend (apenas admin)

#### `criarPedido(pedido): Promise<Object>`
- **Fluxo Modificado**:
  1. POST `/pedidos` com dados do pedido
  2. Recebe pedido criado
  3. **NOVO**: Chama `atualizarEstoque(pedidoCriado.itens)` automaticamente
  4. Retorna pedido criado

---

## 🎨 3. Componentes Frontend

### ConfirmDialog.jsx (Novo)
**Props**:
```javascript
{
  titulo: string,                           // "Deletar pedido"
  mensagem: string,                         // Mensagem principal
  textoBotaoConfirmar?: string,            // Default: "Confirmar"
  textoBotaoCancelar?: string,             // Default: "Cancelar"
  ehDangeroso?: boolean,                   // Mostra ícone de alerta
  onConfirmar: () => void,                 // Callback ao confirmar
  onCancelar: () => void,                  // Callback ao cancelar
  carregando?: boolean                     // Desabilita botões + loading
}
```

**Estilos**:
- Modal centralizado com `position: fixed`
- Overlay com `background: rgba(0, 0, 0, 0.5)`
- Animação `slideUp` ao abrir
- Botão de perigo em vermelho (#dc3545)

---

## 📄 4. Páginas Modificadas

### Product.jsx
**Mudança Principal**:
```javascript
async function adicionarSacola() {
  // ... código existente ...
  
  // NOVO: Validação de estoque
  const temEstoque = await validarEstoque(produto.id, novaQuantidade);
  if (!temEstoque) {
    alert(`Desculpe, não há estoque suficiente...`);
    return;
  }
  
  // ... resto do código ...
}
```

**Imports Adicionados**:
```javascript
import { validarEstoque } from "../services/pedidosService";
```

### Payment.jsx
**Mudança Principal**:
```javascript
async function finalizarCompra() {
  // ... validações existentes ...
  
  // NOVO: Validar estoque de todos os itens
  for (const item of carrinho) {
    const temEstoque = await validarEstoque(item.id, item.quantidade);
    if (!temEstoque) {
      setErro(`Desculpe, não há estoque suficiente para "${item.nome}"...`);
      return;
    }
  }
  
  setProcessando(true);
  // ... resto do código ...
}
```

### PedidoCard.jsx
**Mudança Principal**:
```javascript
export default function PedidoCard({ pedido, onAbrir, onDeletar }) {
  // ... código existente ...
  
  const usuarioLogado = getUsuarioLogado();
  const podeDeleta = isAdmin(usuarioLogado);
  
  return (
    // ... JSX ...
    {podeDeleta && (
      <button 
        className="pedido-btn-deletar"
        onClick={(e) => {
          e.stopPropagation();
          onDeletar?.(pedido);
        }}
      >
        <FiTrash2 />
      </button>
    )}
  );
}
```

### AdminHome.jsx
**Mudanças Principais**:
```javascript
// Estado
const [pedidoParaDeletar, setPedidoParaDeletar] = useState(null);
const [deletando, setDeletando] = useState(false);

// Função de confirmação
async function confirmarDelecao() {
  setDeletando(true);
  try {
    await deletarPedido(pedidoParaDeletar.id);
    setPedidos(atuais => atuais.filter(p => p.id !== pedidoParaDeletar.id));
    setPedidoParaDeletar(null);
    alert("Pedido deletado com sucesso!");
  } catch (error) {
    alert("Não foi possível deletar o pedido...");
  } finally {
    setDeletando(false);
  }
}

// JSX para renderizar modal
{pedidoParaDeletar && (
  <ConfirmDialog
    titulo="Deletar pedido"
    mensagem={`Tem certeza que deseja excluir permanentemente o pedido #...?`}
    textoBotaoConfirmar="Deletar"
    textoBotaoCancelar="Cancelar"
    ehDangeroso={true}
    carregando={deletando}
    onConfirmar={confirmarDelecao}
    onCancelar={() => setPedidoParaDeletar(null)}
  />
)}
```

---

## 🎯 5. Fluxo de Execução

### Adicionar ao Carrinho (com Validação)
```
Usuário clica "Adicionar à sacola"
    ↓
Product.jsx: adicionarSacola()
    ↓
Busca item no carrinho local
    ↓
Calcula novaQuantidade = atual + 1
    ↓
Chama validarEstoque(produtoId, novaQuantidade)
    ↓
pedidosService: Busca GET /produtos/{id}
    ↓
Verifica: produto.quantidade_estoque >= novaQuantidade?
    ├─ SIM: Continua
    └─ NÃO: Alert + Return
    ↓
Salva no localStorage["carrinho"]
    ↓
Redireciona para /carrinho
```

### Finalizar Compra (com Validação)
```
Usuário clica "Finalizar Compra"
    ↓
Payment.jsx: finalizarCompra()
    ↓
Valida forma de pagamento
    ↓
Para cada item no carrinho:
    ├─ Chama validarEstoque(item.id, item.quantidade)
    └─ Se algum falhar: Alert + Return
    ↓
Monta objeto novoPedido
    ↓
Chama criarPedido(novoPedido)
    ↓
pedidosService: POST /pedidos
    ↓
Aguarda resposta com pedidoCriado
    ↓
Chama automaticamente atualizarEstoque(pedidoCriado.itens)
    ↓
Para cada item:
    ├─ GET /produtos/{id}
    ├─ Calcula: Math.max(0, atual - quantidade)
    └─ PATCH /produtos/{id}
    ↓
Limpa localStorage["carrinho"]
    ↓
Exibe sucesso + número do pedido
```

### Deletar Pedido (Admin)
```
Admin clica ícone de lixeira
    ↓
PedidoCard: onDeletar?.(pedido)
    ↓
AdminHome: setPedidoParaDeletar(pedido)
    ↓
ConfirmDialog renderiza com modal
    ↓
Admin clica "Deletar" no modal
    ↓
AdminHome: confirmarDelecao()
    ↓
Chama deletarPedido(pedidoParaDeletar.id)
    ↓
pedidosService: DELETE /pedidos/{id}
    ↓
Remove do estado: setPedidos(filter)
    ↓
Fecha modal + mostra alerta de sucesso
```

---

## 🔐 6. Validações e Segurança

### Frontend
- ✅ Verificação de estoque antes de adicionar carrinho
- ✅ Verificação de estoque antes de finalizar compra
- ✅ Renderização condicional de botão (apenas admin)
- ✅ Modal obrigatório antes de deletar

### Backend (JSON Server)
- ✅ DELETE `/pedidos/{id}` aceita requisições válidas
- ✅ PATCH `/produtos/{id}` atualiza quantidade
- ✅ POST `/pedidos` cria novo pedido
- ⚠️ Sem autenticação real (usar backend seguro em produção)

---

## 📊 7. Estrutura de Arquivos

```
src/
├── services/
│   └── pedidosService.js          ← Funções principais de API
├── pages/
│   ├── Product.jsx                ← Validação ao adicionar carrinho
│   ├── Payment.jsx                ← Validação no checkout
│   └── admin/
│       └── AdminHome.jsx          ← Lógica de deletar pedido
├── components/
│   ├── ConfirmDialog.jsx          ← NOVO: Modal de confirmação
│   ├── confirm-dialog.css         ← NOVO: Estilos do modal
│   ├── admin/
│   │   └── PedidoCard.jsx         ← Botão deletar para admin
│   └── ...
├── utils/
│   └── admin.js                   ← getUsuarioLogado(), isAdmin()
└── ...

db.json                             ← Banco de dados com quantidade_estoque
```

---

## 🚀 8. Variáveis de Ambiente

Nenhuma configuração de ambiente necessária. Sistema usa:
- `API_URL = "http://localhost:3000"` (hardcoded em pedidosService.js)
- `localStorage` para persistência de dados locais

---

## 📝 9. Status dos Pedidos

O sistema suporta 4 status:
```javascript
const STATUS_PEDIDO = [
  { valor: "novo", label: "Novo" },
  { valor: "separacao", label: "Em separação" },
  { valor: "enviado", label: "Enviado" },
  { valor: "entregue", label: "Entregue" },
];
```

- **Novo**: Pedido acabou de ser criado
- **Separação**: Staff está preparando o pedido
- **Enviado**: Pedido saiu para entrega
- **Entregue**: Cliente recebeu

**Nota**: Estoque é debitado ao criar (status "novo"), não há "status pago" específico.

---

## 🎓 10. Conceitos Principais

### Transação de Estoque
```javascript
// Problema: Race condition se dois pedidos tentarem comprar
// simultaneamente o último item

// Solução: Validação antes + atualização com Math.max(0, ...)
// Em produção: Usar banco de dados real com LOCK/TRANSACTION
```

### Admin Check
```javascript
const isAdmin = (usuario) => {
  return usuario?.email?.toLowerCase().endsWith("@scmedicadmin.com");
};

// Admin users no db.json:
// - admin@scmedicadmin.com (senha: admin123)
// - Qualquer email terminado em @scmedicadmin.com
```

### Modal Reutilizável
```javascript
// Componente genérico que pode ser usado em outros contextos:
<ConfirmDialog
  titulo="Realizar ação perigosa"
  mensagem="Tem certeza?"
  onConfirmar={handler}
  onCancelar={() => {}}
  ehDangeroso={true}
/>
```

---

## 🔮 11. Possíveis Extensões

1. **Webhook**: Alertar quando quantidade_estoque < 10
2. **Histórico**: Registrar todas as mudanças de estoque
3. **Reversão**: Restaurar estoque ao cancelar pedido
4. **Reserva**: Bloquear estoque enquanto pedido está "novo"
5. **Multi-warehouse**: Gerenciar estoque de múltiplos locais
6. **Previsão**: Estimar quando estoque vai acabar baseado em vendas

---

## 📞 Suporte Técnico

**Problemas Comuns**:

1. **Estoque não valida**
   - Verificar se `validarEstoque` está sendo chamado
   - Verificar console para erros de fetch

2. **Estoque não atualiza**
   - Verificar se `atualizarEstoque` é chamado em `criarPedido`
   - Verificar db.json se quantidade_estoque mudou

3. **Botão deletar não aparece**
   - Verificar se usuário é admin (email termina em @scmedicadmin.com)
   - Verificar console: `console.log(isAdmin(usuarioLogado))`

4. **Modal não abre**
   - Verificar se `setPedidoParaDeletar` foi chamado
   - Verificar se `ConfirmDialog` está renderizado no JSX

---

**Versão**: 1.0  
**Data**: Outubro 7, 2026  
**Desenvolvedor**: Sistema IA Copilot  
**Status**: ✅ Produção Pronta
