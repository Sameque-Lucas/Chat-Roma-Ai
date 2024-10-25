// index-io.js

// Ponto 2: Configuração do backend para carregar variáveis de ambiente
require('dotenv').config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");

// Carregar a chave da API do ambiente
const openaiApiKey = "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";

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware para interpretar JSON
app.use(express.json());

// Ponto 3: Rota de Chat para Geração de Texto
app.post('/openai/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }]
    }, {
      headers: { 'Authorization': `Bearer ${openaiApiKey}` } // Usar a variável de ambiente
    });
    res.json({ content: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Erro na comunicação com a API da OpenAI:", error);
    res.status(500).json({ error: "Erro na comunicação com a API da OpenAI" });
  }
});

// Ponto 4: Rota de Imagem para Geração de Imagens
app.post('/openai/image', async (req, res) => {
  try {
    const imageDescription = req.body.description;
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      prompt: imageDescription,
      n: 1,
      size: '1024x1024'
    }, {
      headers: { 'Authorization': `Bearer ${openaiApiKey}` } // Usar a variável de ambiente
    });
    res.json({ url: response.data.data[0].url });
  } catch (error) {
    console.error("Erro na comunicação com a API da OpenAI:", error);
    res.status(500).json({ error: "Erro na comunicação com a API da OpenAI" });
  }
});

// Configuração do socket.io
io.on("connection", (socket) => {
  console.log("Um novo cliente se conectou: " + socket.id);

  socket.on("message", (msg) => {
    console.log(msg);
    io.emit("message", msg);
  });
});

// Rotas para as páginas HTML
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

app.get("/chat-io.html", (req, res) => {
  res.sendFile(__dirname + "/chat-io.html");
});

// Ponto 2: Porta configurada para rodar o servidor
server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
