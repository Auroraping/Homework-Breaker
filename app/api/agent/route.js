export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey, baseUrl, model, persona, requirements, contextText } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key is required' }), { status: 400 });
    }

    const apiUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
    const modelName = model || 'gpt-3.5-turbo';

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event, data) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent('status', { step: 'drafting', message: 'Generating initial draft...' });

          // 1. DRAFTING PHASE
          const draftSystemPrompt = `You are an AI assistant helping a student complete their assignment. 
Follow these persona constraints strictly:
- Education Level: ${persona.level || 'College'}
- Writing Style: ${persona.style || 'Standard'}
- IMPORTANT CONSTRAINTS: ${persona.constraints || 'None. Match the education level appropriately.'}
Do not use overly complex or out-of-syllabus methods if the education level is low. 
Do not make it sound like an AI. Mimic human writing logic.`;

          const draftUserPrompt = `Assignment Requirements:\n${requirements}\n\nReference Material/Context:\n${contextText || 'None'}\n\nPlease generate the assignment content now.`;

          const draftRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: draftSystemPrompt },
                { role: 'user', content: draftUserPrompt }
              ],
              temperature: 0.7
            })
          });

          if (!draftRes.ok) {
            const err = await draftRes.text();
            throw new Error(`LLM API Error: ${draftRes.status} ${err}`);
          }

          const draftData = await draftRes.json();
          const draftText = draftData.choices[0].message.content;

          sendEvent('status', { step: 'reflecting', message: 'Reviewing and refining the draft to ensure quality and human-like logic...' });

          // 2. REFLECTION PHASE
          const reflectSystemPrompt = `You are a critical reviewer evaluating an assignment draft. 
Check if the draft sounds too much like an AI, uses overly mature language for a ${persona.level || 'College'} student, or violates these constraints: ${persona.constraints || 'None'}.
If it does, rewrite it to be more natural and appropriate. If it is already good, output it with minor polishes.
Output ONLY the final rewritten assignment content. Do not include your analysis.`;

          const reflectUserPrompt = `Original Requirements:\n${requirements}\n\nDraft to review:\n${draftText}`;

          const reflectRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: reflectSystemPrompt },
                { role: 'user', content: reflectUserPrompt }
              ],
              temperature: 0.5,
              stream: true
            })
          });

          if (!reflectRes.ok) {
            const err = await reflectRes.text();
            throw new Error(`LLM API Error during reflection: ${reflectRes.status} ${err}`);
          }

          sendEvent('status', { step: 'streaming', message: 'Finalizing output...' });

          const reader = reflectRes.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim() !== '');
              for (const line of lines) {
                if (line.replace(/^data: /, '').trim() === '[DONE]') {
                  continue;
                }
                if (line.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                      sendEvent('token', { text: parsed.choices[0].delta.content });
                    }
                  } catch (e) {
                    // Ignore parse errors from incomplete chunks
                  }
                }
              }
            }
          }

          sendEvent('done', { message: 'Workflow completed successfully.' });
          controller.close();
        } catch (error) {
          sendEvent('error', { message: error.message });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Agent error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
