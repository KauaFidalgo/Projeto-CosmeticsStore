import http from 'http';

async function testarAPI() {
  const opcoes = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/financial/orders?period=month&page=1&pageSize=5',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer admin-001',
      'X-Role': 'ADMIN',
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(opcoes, (res) => {
      let dados = '';

      res.on('data', (chunk) => {
        dados += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Resposta:', dados);
        try {
          const json = JSON.parse(dados);
          console.log('JSON Válido ✓');
          resolve(json);
        } catch (e) {
          console.log('Erro ao parsear JSON:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Erro na requisição: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

// Aguardar 2 segundos e depois testar
setTimeout(() => {
  testarAPI()
    .then(() => {
      console.log('\n✅ API Financeira funcionando corretamente!');
      process.exit(0);
    })
    .catch((erro) => {
      console.log('\n❌ Erro ao testar API:', erro.message);
      process.exit(1);
    });
}, 2000);
