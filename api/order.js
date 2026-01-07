export default async function handler(req, res) {
  const data = req.method === 'POST' ? req.body : req.query;

  // --- CONFIGURAÇÃO ---
  const token = 'YTFKNZQZMZETNMIXZS00ZGM4LWI5NTCTYWYWZDI5ZJAYMMNJ';
  const streamCode = 'irul3';
  // --------------------

  try {
    // Mapeamento para API Dr.Cash (JSON)
    const payload = {
      stream_code: streamCode,
      client: {
        name: data.name,
        phone: data.phone,
        ip: req.headers['x-forwarded-for'] || '127.0.0.1'
      },
      sub1: data.subacc || '' // ClickID do Google
    };

    console.log("Enviando...", payload);

    const response = await fetch('https://order.drcash.sh/v1/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // SUCESSO: Redireciona para a Home com flag de sucesso para abrir o popup
      return res.redirect(302, '/?status=success');
    } else {
      // ERRO: Mostra na tela para debug
      const errorText = await response.text();
      return res.status(400).json({ erro: "Dr.Cash Recusou", detalhe: errorText, payload });
    }
  } catch (error) {
    return res.status(500).json({ erro_interno: error.message });
  }
}
