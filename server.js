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
    if (!apiKey) return res.status(500).json({ erro: 'Chave da API não configurada no Render.' });
    
    const resposta = await axios.get('https://api.football-data.org/v4/competitions/BSA/matches', {
      headers: { 'X-Auth-Token': apiKey }
    });

    const traduzirStatus = {
      'SCHEDULED': 'AGENDADO', 'TIMED': 'AGENDADO', 'IN_PLAY': 'AO VIVO',
      'PAUSED': 'INTERVALO', 'FINISHED': 'FINALIZADO', 'POSTPONED': 'ADIADO',
      'SUSPENDED': 'SUSPENSO', 'CANCELED': 'CANCELADO'
    };

    const jogos = resposta.data.matches.map(jogo => ({
      id: jogo.id,
      timeCasa: jogo.homeTeam.name || 'Time A',
      timeFora: jogo.awayTeam.name || 'Time B',
      golsCasa: jogo.score.fullTime.home,
      golsFora: jogo.score.fullTime.away,
      statusOriginal: jogo.status,
      statusTraduzido: traduzirStatus[jogo.status] || jogo.status,
      data: jogo.utcDate,
      liga: jogo.competition.name
    }));

    res.json(jogos);
  } catch (erro) {
    res.status(500).json({ erro: 'Falha ao buscar dados reais', detalhe: erro.message });
  }
});

// NOVA ROTA: Detalhes de um jogo específico
app.get('/api/jogo/:id', async (req, res) => {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    const idJogo = req.params.id;

    const resposta = await axios.get(`https://api.football-data.org/v4/matches/${idJogo}`, {
      headers: { 'X-Auth-Token': apiKey }
    });

    const jogo = resposta.data;
    
    // Extrair estatísticas (a API pode retornar nulo se o jogo não tiver começado)
    const estatisticas = {
      timeCasa: jogo.homeTeam.name,
      timeFora: jogo.awayTeam.name,
      golsCasa: jogo.score.fullTime.home || 0,
      golsFora: jogo.score.fullTime.away || 0,
      // Detalhes que a API fornece no plano free (quando disponível)
      arbitro: jogo.referees && jogo.referees[0] ? jogo.referees[0].name : 'Não informado',
      estadio: jogo.venue || 'Não informado',
      publico: jogo.attendance || 'Não informado',
      // Cartões
      cartoesCasa: jogo.bookings ? jogo.bookings.filter(b => b.team.id === jogo.homeTeam.id).length : 0,
      cartoesFora: jogo.bookings ? jogo.bookings.filter(b => b.team.id === jogo.awayTeam.id).length : 0,
      // Substituições
      subsCasa: jogo.substitutions ? jogo.substitutions.filter(s => s.team.id === jogo.homeTeam.id).length : 0,
      subsFora: jogo.substitutions ? jogo.substitutions.filter(s => s.team.id === jogo.awayTeam.id).length : 0,
    };

    res.json(estatisticas);
  } catch (erro) {
    console.error('Erro ao buscar detalhes:', erro.message);
    res.status(500).json({ erro: 'Falha ao buscar detalhes do jogo', detalhe: erro.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
