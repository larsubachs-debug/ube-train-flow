import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "generate-full-program") {
      systemPrompt = `Je bent een expert fitness coach en programma ontwerper. Genereer een compleet trainingsprogramma met alle details.
      
Retourneer ALLEEN pure JSON zonder markdown formatting, zonder \`\`\`json tags.

Het JSON formaat moet EXACT zo zijn:
{
  "program": {
    "name": "Programma naam",
    "description": "Programma beschrijving",
    "weeks": [
      {
        "name": "Week naam",
        "description": "Week beschrijving",
        "phase_name": "Fase naam (bijv. Base Building, Intensification)",
        "workouts": [
          {
            "name": "Workout naam",
            "dayNumber": 1,
            "duration": 60,
            "exercises": [
              {
                "name": "Oefening naam",
                "category": "warmup" OF "mainlift" OF "accessory" OF "conditioning",
                "sets": 3,
                "reps": "8-10",
                "weight": null,
                "time": null,
                "distance": null,
                "rpe": 7,
                "notes": "Oefening notities",
                "group_id": null,
                "group_type": null
              }
            ]
          }
        ]
      }
    ]
  }
}

BELANGRIJKE REGELS:
- Voor cardio oefeningen: gebruik "time" en/of "distance", NIET "reps" of "sets"
- Voor strength oefeningen: gebruik "sets" en "reps"
- Voor supersets: geef 2-4 oefeningen dezelfde "group_id" (bijv. "group-1") en zet "group_type" op "superset", "tri-set", of "giant-set"
- Gebruik Nederlandse namen voor oefeningen
- Zorg dat elke workout 4-8 oefeningen heeft
- Varieer tussen categories: warmup, mainlift, accessory, conditioning
- Maak progressie door de weken heen (volume, intensiteit, of complexiteit)
- Splits het programma in logische fases als het langer dan 6 weken is`;

      userPrompt = `Genereer een compleet trainingsprogramma met de volgende specificaties:

Programma Naam: ${context.programName}
Type: ${context.programType}
Duur: ${context.duration} weken
Frequentie: ${context.frequency}x per week
Niveau: ${context.level}
Doel/Focus: ${context.goal}
Apparatuur: ${context.equipment}
${context.additionalInfo ? `\nExtra informatie: ${context.additionalInfo}` : ""}

Maak een volledig uitgewerkt programma met:
- Alle ${context.duration} weken
- ${context.frequency} workouts per week
- Progressie door de weken heen
- Logische periodisering
- Gevarieerde oefeningen en trainingsmethodes`;

    } else if (type === "generate-week") {
      systemPrompt = `Je bent een expert fitness coach. Genereer een compleet weekprogramma met workouts en oefeningen.
      
Retourneer ALLEEN pure JSON zonder markdown formatting, zonder \`\`\`json tags.

Het JSON formaat moet EXACT zo zijn:
{
  "week": {
    "name": "Week naam",
    "description": "Korte beschrijving",
    "phase_name": "Fase naam (optioneel)",
    "workouts": [
      {
        "name": "Workout naam",
        "dayNumber": 1,
        "duration": 60,
        "exercises": [
          {
            "name": "Oefening naam",
            "category": "warmup" OF "mainlift" OF "accessory" OF "conditioning",
            "sets": 3,
            "reps": "8-10",
            "weight": null,
            "time": null,
            "distance": null,
            "rpe": 7,
            "notes": "Oefening notities",
            "group_id": null,
            "group_type": null
          }
        ]
      }
    ]
  }
}

BELANGRIJKE REGELS:
- Voor cardio oefeningen (category "conditioning"): gebruik "time" en/of "distance", NIET "reps" of "sets"
- Voor strength oefeningen: gebruik "sets" en "reps"
- Voor supersets: geef 2-4 oefeningen dezelfde "group_id" (bijv. "group-1") en zet "group_type" op "superset", "tri-set", of "giant-set"
- Gebruik Nederlandse namen voor oefeningen
- Zorg dat elke workout 4-8 oefeningen heeft
- Varieer tussen categories: warmup, mainlift, accessory, conditioning`;

      userPrompt = `Genereer een compleet weekprogramma met de volgende context:
${context.programType ? `- Programma type: ${context.programType}` : ""}
${context.weekNumber ? `- Week nummer: ${context.weekNumber}` : ""}
${context.focus ? `- Focus: ${context.focus}` : ""}
${context.additionalInfo ? `- Extra info: ${context.additionalInfo}` : ""}

Maak minimaal 3 workouts voor deze week.`;

    } else if (type === "generate-exercises") {
      systemPrompt = `Je bent een expert fitness coach. Genereer oefeningen voor een workout.
      
Retourneer ALLEEN pure JSON zonder markdown formatting, zonder \`\`\`json tags.

Het JSON formaat moet EXACT zo zijn:
{
  "exercises": [
    {
      "name": "Oefening naam",
      "category": "warmup" OF "mainlift" OF "accessory" OF "conditioning",
      "sets": 3,
      "reps": "8-10",
      "weight": null,
      "time": null,
      "distance": null,
      "rpe": 7,
      "notes": "Oefening notities",
      "group_id": null,
      "group_type": null
    }
  ]
}

BELANGRIJKE REGELS:
- Voor cardio oefeningen (category "conditioning"): gebruik "time" en/of "distance", NIET "reps" of "sets"
- Voor strength oefeningen: gebruik "sets" en "reps"
- Voor supersets: geef 2-4 oefeningen dezelfde "group_id" (bijv. "group-1") en zet "group_type" op "superset", "tri-set", of "giant-set"
- Gebruik Nederlandse namen`;

      userPrompt = `Genereer ${context.count || 5} oefeningen met de volgende context:
${context.category ? `- Category: ${context.category}` : ""}
${context.workoutType ? `- Workout type: ${context.workoutType}` : ""}
${context.focus ? `- Focus: ${context.focus}` : ""}
${context.includeSuperset ? `- Maak een superset van 2-3 oefeningen` : ""}`;

    } else {
      throw new Error("Invalid type");
    }

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits overschreden, probeer het later opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Betaling vereist, voeg credits toe aan je Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway fout" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("Geen content ontvangen van AI");
    }

    // Parse the JSON response, removing any markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/```\n?/g, "");
    }
    
    const parsedContent = JSON.parse(cleanContent);

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("generate-program error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});