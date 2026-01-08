import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Je bent een ervaren personal trainer en fitness coach. 
Je geeft korte, motiverende inzichten over trainingsschema's in het Nederlands.
Wees specifiek over de effecten en resultaten die de gebruiker kan verwachten.
Houd je antwoord onder de 40 woorden.
Gebruik geen emoji's of uitroeptekens.
Focus op fysiologische effecten en wat het lichaam gaat doen.`;

    const userPrompt = `Geef een kort inzicht over wat dit trainingsblok gaat opleveren:

Programma: ${context.programName}
Beschrijving: ${context.programDescription || 'Krachttraining programma'}
Huidige week: ${context.currentWeek} van ${context.totalWeeks}
Fase: ${context.phaseName || 'Training fase'}
${context.phaseDescription ? `Fase beschrijving: ${context.phaseDescription}` : ''}
Workouts per week: ${context.workoutsPerWeek}
Workouts: ${context.workoutSummary}

Leg kort uit wat het effect van deze trainingsweek gaat zijn op het lichaam.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim() || 
      "Focus op kracht en conditie opbouw deze week.";

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating insight:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        insight: "Focus op progressieve opbouw en goede techniek deze week."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
