const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1 style="color:green; text-align:center; margin-top:50px;">Servidor funcionando perfeitamente!</h1><p style="text-align:center;">Agora vamos adicionar o visual do app.</p>');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});