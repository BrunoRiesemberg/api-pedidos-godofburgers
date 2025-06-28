// server.js (API de Pedidos Simples)

const express = require('express');
const fs = 'fs';
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Porta para rodar o servidor
const DB_FILE = path.join(__dirname, 'db.json'); // Nosso "banco de dados" em arquivo

// --- Middlewares ---
app.use(cors()); // Permite que seu cardápio acesse a API
app.use(express.json()); // Permite que a API entenda JSON

// --- Funções do "Banco de Dados" ---

// Função para ler os dados do nosso arquivo
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        return { pedidos: [] };
    }
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
}

// Função para escrever os dados no nosso arquivo
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- Rotas da API ---

// Rota 1: O cardápio virtual envia um novo pedido para cá (POST)
app.post('/pedidos', (req, res) => {
    const db = readDB();
    const novoPedido = {
        id: Date.now().toString(), // ID único baseado no tempo
        recebidoPeloPDV: false, // O PDV ainda não pegou esse pedido
        dataCriacao: new Date().toISOString(),
        ...req.body // Adiciona os dados do pedido (cliente, itens, etc.)
    };

    db.pedidos.push(novoPedido);
    writeDB(db);

    console.log(`Novo pedido recebido: ID ${novoPedido.id}`);
    res.status(201).json(novoPedido);
});

// Rota 2: O sistema PDV pergunta por novos pedidos para uma loja específica (GET)
app.get('/pedidos/novos/:id_da_loja', (req, res) => {
    const { id_da_loja } = req.params;
    const db = readDB();

    // Filtra apenas os pedidos que são para essa loja e que o PDV ainda não recebeu
    const pedidosNovos = db.pedidos.filter(p => p.storeId === id_da_loja && !p.recebidoPeloPDV);

    if (pedidosNovos.length === 0) {
        return res.status(404).json({ message: 'Nenhum pedido novo encontrado.' });
    }

    console.log(`Enviando ${pedidosNovos.length} pedido(s) novo(s) para a loja ${id_da_loja}`);
    res.status(200).json(pedidosNovos);
});

// Rota 3: O sistema PDV avisa que já recebeu um pedido (PUT)
app.put('/pedidos/:id_do_pedido/recebido', (req, res) => {
    const { id_do_pedido } = req.params;
    const db = readDB();

    const pedidoIndex = db.pedidos.findIndex(p => p.id === id_do_pedido);

    if (pedidoIndex === -1) {
        return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    db.pedidos[pedidoIndex].recebidoPeloPDV = true;
    writeDB(db);

    console.log(`Pedido ${id_do_pedido} marcado como recebido pelo PDV.`);
    res.status(200).json({ message: 'Pedido marcado como recebido.' });
});

// --- Iniciar o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor da API de pedidos rodando na porta ${PORT}`);
});