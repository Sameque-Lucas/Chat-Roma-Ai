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
const clashRoyaleApiKey = process.env.CLASH_ROYALE_API_KEY;

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

// Nova rota para retornar a imagem de gato
app.get("/cat", async (req, res) => {
  try {
    // Buscando imagem de gato usando a API TheCatAPI
    const response = await axios.get('https://api.thecatapi.com/v1/images/search');
    const catImageUrl = response.data[0].url;
    res.json({ url: catImageUrl }); // Envia a URL da imagem de gato
  } catch (error) {
    console.error("Erro ao buscar imagem de gato:", error);
    res.status(500).json({ error: "Erro ao buscar imagem de gato" });
  }
});

// Nova rota para retornar a imagem de cachorro
app.get("/dog", async (req, res) => {
  try {
    // Buscando imagem de cachorro usando a API Dog CEO's Dog API
    const response = await axios.get('https://dog.ceo/api/breeds/image/random');
    const dogImageUrl = response.data.message;
    res.json({ url: dogImageUrl }); // Envia a URL da imagem de cachorro
  } catch (error) {
    console.error("Erro ao buscar imagem de cachorro:", error);
    res.status(500).json({ error: "Erro ao buscar imagem de cachorro" });
  }
});

app.get("/fox", async (req, res) => {
  try {
    // Buscando imagem de raposa usando a API RandomFox
    const response = await axios.get('https://randomfox.ca/floof/');
    const foxImageUrl = response.data.image;
    res.json({ url: foxImageUrl }); // Envia a URL da imagem de raposa
  } catch (error) {
    console.error("Erro ao buscar imagem de raposa:", error);
    res.status(500).json({ error: "Erro ao buscar imagem de raposa" });
  }

});

app.get("/clash-royale/cards", async (req, res) => {
  try {
    const response = await axios.get('https://api.clashroyale.com/v1/cards', {
      headers: {
        Authorization: `Bearer ${clashRoyaleApiKey}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar informações das cartas:", error);
    res.status(500).json({ error: "Erro ao buscar informações das cartas" });
  }
});

app.get("/sounds/:type", (req, res) => {
  const sounds = {
    cat: "https://www.myinstants.com/pt/instant/seu-madruga-nossa/?utm_source=copy&utm_medium=share",
    dog: "https://www.myinstants.com/media/sounds/dog-bark.mp3",
    fox: "https://freesound.org/s/676376/",
    lion: "https://www.myinstants.com/media/sounds/lion-roar.mp3",
    mario: "https://www.myinstants.com/media/sounds/mario-coin.mp3",
    victory: "https://www.myinstants.com/media/sounds/victory.mp3",
    saber: "https://www.myinstants.com/media/sounds/lightsaber.mp3",
    wow: "https://www.myinstants.com/media/sounds/wow.mp3"
  };

  const sound = sounds[req.params.type];
  if (sound) {
    res.json({ url: sound });
  } else {
    res.status(404).send("Som não encontrado.");
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
