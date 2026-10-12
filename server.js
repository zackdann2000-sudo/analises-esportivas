const express = require('express');
const path = require('path');
const app = express();

// O Render fornece a porta, se não, usa a 3000 localmente
const PORT = process.env.PORT || 3000; 

// Serve os arquivos da pasta 'public' (onde ficará o HTML/CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// IMPORTANTE: Escutar em '0.0.0.0' para o Render conseguir acessar
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});