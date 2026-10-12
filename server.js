const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve a pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// NOVA ROTA: Buscar jogos reais da API
app.get('/api/jogos', async (req, res) => {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    
    // Faz a requisição para a API (Buscando jogos da Champions League como teste)
    const resposta = await axios.get('https://api.football-data.org/v4/competitions/CL/matches', {
      headers: { 'X-Auth-Token': apiKey }
    });

    // Filtra apenas as informações que precisamos para o frontend
    const jogos = resposta.data.matches.map(jogo => ({
      id: jogo.id,
      timeCasa: jogo.homeTeam.name || 'Time A',
      timeFora: jogo.awayTeam.name || 'Time B',
      golsCasa: jogo.score.fullTime.home,
      golsFora: jogo.score.fullTime.away,
      status: jogo.status,
      data: jogo.utcDate,
      liga: jogo.competition.name
    }));

    res.json(jogos);
  } catch (erro) {
    console.error('Erro ao buscar API:', erro.message);
    res.status(500).json({ erro: 'Falha ao buscar dados reais' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
