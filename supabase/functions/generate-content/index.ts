import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords, additionalContext, contentLength, tone, imageBase64, useGemini, geminiApiKey } = await req.json();

    const lengthGuide = {
      short: '50-100 words',
      medium: '150-250 words',
      long: '300-500 words',
    };

    const toneGuide = {
      friendly: 'casual, warm, use emojis sparingly, conversational',
      informative: 'clear, factual, educational, structured',
      persuasive: 'sales-oriented, include call-to-action, compelling',
      technical: 'professional, detailed specifications, expert tone',
      storytelling: 'narrative, engaging, emotional connection',
      descriptive: 'poetic, vivid imagery, detailed descriptions',
    };

    const systemPrompt = `You are an expert Myanmar advertising copywriter. Create compelling ad content in both Myanmar (Burmese) and English. 

Guidelines:
- Write the content primarily for Myanmar audience
- Include both Myanmar and English versions when appropriate
- Match the specified tone exactly
- Keep content within the specified length
- Make it engaging and shareable on social media
- Include relevant hashtags at the end`;

    const userPrompt = `Create ad content for:

Topic/Product: ${topic}
${keywords ? `Keywords: ${keywords}` : ''}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Tone: ${tone} (${toneGuide[tone as keyof typeof toneGuide] || 'professional'})
Length: ${lengthGuide[contentLength as keyof typeof lengthGuide] || '150-250 words'}

${imageBase64 ? 'Note: Visual reference image was provided. Consider visual elements in your copy.' : ''}

Please provide the ad content now:`;

    let response;
    
    // Use Lovable AI by default, Gemini API if provided
    if (useGemini && geminiApiKey) {
      // Use Google Gemini directly
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + geminiApiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini error:', errorText);
        throw new Error('Gemini API error');
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Use Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error('AI gateway error');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
