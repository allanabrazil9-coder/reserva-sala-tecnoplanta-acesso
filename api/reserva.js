
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido.'
    });
  }

  const gasUrl = process.env.GAS_WEB_APP_URL;
  const token = process.env.API_TOKEN;

  if (!gasUrl || !token) {
    return res.status(500).json({
      success: false,
      message: 'A integração não está configurada no servidor.'
    });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    if (!body || !['availability', 'reserve'].includes(body.action)) {
      return res.status(400).json({
        success: false,
        message: 'Solicitação inválida.'
      });
    }

    if (
      body.action === 'availability' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(body.date || '')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Informe uma data válida.'
      });
    }

    if (body.action === 'reserve' && !body.data) {
      return res.status(400).json({
        success: false,
        message: 'Dados da reserva não informados.'
      });
    }

    const resposta = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        action: body.action,
        date: body.date,
        data: body.data
      }),
      redirect: 'follow'
    });

    const texto = await resposta.text();

    let resultado;
    try {
      resultado = JSON.parse(texto);
    } catch (erro) {
      console.error('Resposta inesperada do Apps Script:', texto);
      return res.status(502).json({
        success: false,
        message: 'O Google Apps Script retornou uma resposta inesperada.'
      });
    }

    return res.status(resposta.ok ? 200 : 502).json(resultado);

  } catch (erro) {
    console.error('Erro na integração com Apps Script:', erro);

    return res.status(502).json({
      success: false,
      message: 'Não foi possível comunicar com o sistema de reservas.'
    });
  }
};

