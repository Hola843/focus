export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Faltan mensajes' });
  }

  // Gemini usa "contents" con roles "user"/"model" en vez de "user"/"assistant"
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{
              text: 'Eres el tutor de estudio integrado en la app Estela. Ayudas al usuario a resolver dudas sobre exámenes y temario de forma clara, con ejemplos y explicaciones paso a paso. No te limites a dar la respuesta final si el usuario está aprendiendo un concepto: guíalo. Responde siempre en español, de forma breve y directa salvo que pida más detalle.'
            }],
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No he podido generar respuesta.';
    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al contactar con la IA' });
  }
}
