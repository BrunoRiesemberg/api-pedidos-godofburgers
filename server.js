// server.js (VERSÃO CORRIGIDA E CONFIGURADA)

const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Funções do "Banco de Dados" (sem alterações) ---
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        return { pedidos: [] };
    }
    const data = fs.readFileSync(DB_FILE);
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error("Erro ao ler o arquivo db.json, pode estar corrompido. Retornando DB vazio.", e);
        return { pedidos: [] };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- Rotas da API ---

// ROTA ADICIONADA: Rota raiz para verificar se a API está online.
// Agora, ao acessar https://api-godofburgers.onrender.com, você verá esta mensagem.
app.get('/', (req, res) => {
    res.send('Servidor da API God of Burgers está no ar e configurado corretamente!');
});

// Rota 1: Receber um novo pedido do Cardápio Virtual (POST)
// Esta rota já estava correta.
app.post('/pedidos', (req, res) => {
    const db = readDB();
    const novoPedido = {
        id: Date.now().toString(),
        recebidoPeloPDV: false,
        dataCriacao: new Date().toISOString(),
        ...req.body
    };

    db.pedidos.push(novoPedido);
    writeDB(db);

    console.log(`Novo pedido recebido: ID ${novoPedido.id} para a loja ${novoPedido.storeId}`);
    res.status(201).json(novoPedido);
});

// Rota 2: O sistema PDV busca por novos pedidos (GET)
// ALTERAÇÃO: O nome do parâmetro foi mudado de ":id_da_loja" para ":storeId".
// Isso não era a causa do erro, mas padroniza o código para ficar mais claro.
app.get('/pedidos/novos/:storeId', (req, res) => {
    const { storeId } = req.params;
    const db = readDB();

    const pedidosNovos = db.pedidos.filter(p => p.storeId === storeId && !p.recebidoPeloPDV);

    if (pedidosNovos.length === 0) {
        // Retorna 404, o que é esperado pelo PDV quando não há pedidos.
        return res.status(404).json({ message: 'Nenhum pedido novo encontrado.' });
    }

    console.log(`Enviando ${pedidosNovos.length} pedido(s) novo(s) para a loja ${storeId}`);
    res.status(200).json(pedidosNovos);
});

// Rota 3: O sistema PDV avisa que recebeu um pedido (PUT)
// ALTERAÇÃO CRÍTICA: O nome do parâmetro foi mudado de ":id_do_pedido" para ":id".
// O seu PDV (main.js) envia a requisição usando `order.id`, então a rota precisa esperar por um parâmetro chamado `id`.
app.put('/pedidos/:id/recebido', (req, res) => {
    const { id } = req.params;
    const db = readDB();

    const pedidoIndex = db.pedidos.findIndex(p => p.id === id);

    if (pedidoIndex === -1) {
        return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    db.pedidos[pedidoIndex].recebidoPeloPDV = true;
    writeDB(db);

    console.log(`Pedido ${id} marcado como recebido pelo PDV.`);
    res.status(200).json({ message: 'Pedido marcado como recebido.' });
});

// --- Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor da API de pedidos rodando na porta ${PORT}`);
});