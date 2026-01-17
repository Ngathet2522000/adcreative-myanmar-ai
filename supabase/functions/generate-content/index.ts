import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords, additionalContext, contentLength, tone, imageBase64, useGemini, geminiApiKey, userId } = await req.json();

    console.log('Generate content request:', { topic, tone, contentLength, useGemini, hasApiKey: !!geminiApiKey, userId });

    // Initialize Supabase client for usage tracking
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const systemPrompt = `You are an expert Myanmar advertising copywriter. Create compelling ad content in BOTH Myanmar (Burmese) AND English.

IMPORTANT: You MUST provide TWO complete versions of the content:

## 🇲🇲 Myanmar Version
[Write the full ad content in Myanmar/Burmese script here]

## 🇬🇧 English Version  
[Write the full ad content in English here]

Guidelines:
- ALWAYS provide BOTH versions - this is mandatory
- Each version should be complete and standalone
- Match the specified tone exactly in both languages
- Keep each version within the specified length
- Make it engaging and shareable on social media
- Include relevant hashtags at the end of each version
- Separate the two versions clearly with the headers shown above`;

    const userPrompt = `Create ad content for:

Topic/Product: ${topic}
${keywords ? `Keywords: ${keywords}` : ''}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Tone: ${tone} (${toneGuide[tone as keyof typeof toneGuide] || 'professional'})
Length: ${lengthGuide[contentLength as keyof typeof lengthGuide] || '150-250 words'}

${imageBase64 ? 'Note: Visual reference image was provided. Consider visual elements in your copy.' : ''}

Please provide the ad content now:`;

    let response;
    let usageTrackingPromise: Promise<void> | null = null;
    
    // Use Gemini API if provided (user's own key or assigned key)
    if (useGemini && geminiApiKey) {
      console.log('Using Gemini API with provided key');
      
      // Track usage for gemini_sessions (user-provided keys)
      usageTrackingPromise = (async () => {
        try {
          // First try to update gemini_sessions
          const { data: sessionData, error: sessionError } = await supabase
            .from('gemini_sessions')
            .select('id, usage_count')
            .eq('gemini_api_key', geminiApiKey)
            .maybeSingle();

          if (sessionData) {
            await supabase
              .from('gemini_sessions')
              .update({ 
                usage_count: (sessionData.usage_count || 0) + 1,
                last_used_at: new Date().toISOString()
              })
              .eq('id', sessionData.id);
            console.log('Updated gemini_sessions usage count');
          }

          // Also check system_keys if this key is there
          const { data: systemKeyData } = await supabase
            .from('system_keys')
            .select('id, usage_count')
            .eq('api_key', geminiApiKey)
            .maybeSingle();

          if (systemKeyData) {
            await supabase
              .from('system_keys')
              .update({ usage_count: (systemKeyData.usage_count || 0) + 1 })
              .eq('id', systemKeyData.id);
            console.log('Updated system_keys usage count');
          }
        } catch (err) {
          console.error('Usage tracking error:', err);
        }
      })();

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

      // Wait for usage tracking to complete
      if (usageTrackingPromise) await usageTrackingPromise;

      console.log('Content generated successfully with Gemini API');
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Use Lovable AI Gateway (no tracking needed as it's a system resource)
      console.log('Using Lovable AI Gateway');
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

      console.log('Content generated successfully with Lovable AI');
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
