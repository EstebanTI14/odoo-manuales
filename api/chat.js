export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { question, pdfUrls, history } = req.body;

  const docContents = [];
  for (const url of pdfUrls) {
    try {
      const pdfRes = await fetch(url);
      const buffer = await pdfRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      docContents.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 }
      });
    } catch(e) {
      console.error('Error cargando PDF:', url, e);
    }
  }

  const messages = [
    ...(history || []),
    {
      role: 'user',
      content: [...docContents, { type: 'text', text: question }]
    }
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `Sos un asistente de soporte interno especializado en Odoo Community Edition v19. Respondé SIEMPRE en español. Basate únicamente en los documentos proporcionados. Si la información no está en los manuales, decilo claramente. Sé específico y paso a paso cuando expliques procedimientos.`,
      messages
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
