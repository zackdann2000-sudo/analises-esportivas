const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/jogos', async (req, res) => {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ erro: 'Chave da API não configurada no Render.' });
    }
    
    // Busca os jogos do Brasileirão
    const resposta = await axios.get('https://api.football-data.org/v4/competitions/BSA/matches', {
      headers: { 'X-Auth-Token': apiKey }
    });

    // Dicionário para traduzir os status
    const traduzirStatus = {
      'SCHEDULED': 'AGENDADO',
      'TIMED': 'AGENDADO',
      'IN_PLAY': 'AO VIVO',
      'PAUSED': 'INTERVALO',
      'FINISHED': 'FINALIZADO',
      'POSTPONED': 'ADIADO',
      'SUSPENDED': 'SUSPENSO',
      'CANCELED': 'CANCELADO'
    };

    const jogos = resposta.data.matches.map(jogo => ({
      id: jogo.id,
      timeCasa: jogo.homeTeam.name || 'Time A',
      timeFora: jogo.awayTeam.name || 'Time B',
      golsCasa: jogo.score.fullTime.home,
      golsFora: jogo.score.fullTime.away,
      statusOriginal: jogo.status, // Usado para o filtro no frontend
      statusTraduzido: traduzirStatus[jogo.status] || jogo.status,
      data: jogo.utcDate,
      liga: jogo.competition.name
    }));

    res.json(jogos);
  } catch (erro) {
    console.error('Erro ao buscar API:', erro.message);
    let detalheErro = erro.message;
    if (erro.response) {
        detalheErro = `Status ${erro.response.status}: ${erro.response.data.message || erro.message}`;
    }
    res.status(500).json({ erro: 'Falha ao buscar dados reais', detalhe: detalheErro });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
