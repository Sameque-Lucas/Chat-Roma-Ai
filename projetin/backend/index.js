const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");

if (!process.env.OPENAI_API_KEY) {
  console.error("Erro: a chave da API do OpenAI não foi definida. Verifique o arquivo .env.");
  process.exit(1);
}

const openaiApiKey = process.env.OPENAI_API_KEY;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(express.json());

io.on("connection", (socket) => {
  console.log("Um novo cliente se conectou: " + socket.id);
  socket.on("message", (msg) => {
    console.log("Mensagem recebida do cliente:", msg);
    io.emit("message", msg);
  });
});

app.post("/openai/chat", async (req, res) => {
  const userMessage = req.body.message;
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Resposta da OpenAI:", response.data);
    res.json(response.data.choices[0].message.content);
  } catch (error) {
    console.error("Erro ao comunicar com a API do OpenAI:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Erro ao comunicar com a API do OpenAI" });
  }
});

app.post("/openai/image", async (req, res) => {
  const imageDescription = req.body.description;
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        prompt: imageDescription,
        n: 1,
        size: "1024x1024",
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data && response.data.data && response.data.data[0] && response.data.data[0].url) {
      res.json({ url: response.data.data[0].url });
    } else {
      res.status(500).json({ error: "Imagem não gerada corretamente" });
    }
  } catch (error) {
    console.error("Erro ao comunicar com a API do OpenAI:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Erro ao comunicar com a API do OpenAI" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "login.html"));
});

app.get("/chat-io.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "chat-io.html"));
});

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
