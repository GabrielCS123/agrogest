/**
 * api/gemini.js — Vercel Serverless Function (proxy seguro para o Gemini)
 *
 * A chave de API fica APENAS no servidor (variável sem prefixo VITE_).
 * O browser nunca vê a chave, impedindo a revogação automática pelo Google.
 */
export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — permite apenas o próprio domínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
  }

  const { contents, systemInstruction } = req.body;

  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: 'Campo "contents" inválido ou ausente.' });
  }

  const body = { contents };
  if (systemInstruction) {
    body.system_instruction = { parts: [{ text: systemInstruction }] };
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const status = data?.error?.code || geminiRes.status;
      const message = data?.error?.message || 'Erro na API do Gemini';
      console.error('[api/gemini] Erro Gemini:', status, message);
      return res.status(geminiRes.status).json({ error: message, status });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (error) {
    console.error('[api/gemini] Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno no servidor proxy.' });
  }
}
