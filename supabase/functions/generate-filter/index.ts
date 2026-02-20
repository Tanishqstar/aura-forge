import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an AR filter design AI. Given a user's description of an AR filter, generate detailed rendering parameters. You MUST call the generate_filter tool with your response.`,
            },
            {
              role: "user",
              content: `Design an AR filter based on this description: "${prompt}"`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_filter",
                description:
                  "Generate AR filter rendering parameters from a description",
                parameters: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description:
                        "Short catchy name for the filter (2-3 words max)",
                    },
                    filterType: {
                      type: "string",
                      enum: ["crown", "wings", "mask", "halo", "particles", "geometric"],
                      description:
                        "The base shape type that best matches the description",
                    },
                    anchorPoint: {
                      type: "string",
                      enum: ["HEAD", "SHOULDERS", "HAND", "WORLD"],
                      description: "Where on the body the filter anchors",
                    },
                    animation: {
                      type: "string",
                      enum: ["FLOAT", "ROTATE", "PULSE"],
                      description: "The primary animation style",
                    },
                    primaryColor: {
                      type: "object",
                      properties: {
                        h: { type: "number", description: "Hue 0-360" },
                        s: { type: "number", description: "Saturation 0-100" },
                        l: { type: "number", description: "Lightness 0-100" },
                      },
                      required: ["h", "s", "l"],
                    },
                    secondaryColor: {
                      type: "object",
                      properties: {
                        h: { type: "number", description: "Hue 0-360" },
                        s: { type: "number", description: "Saturation 0-100" },
                        l: { type: "number", description: "Lightness 0-100" },
                      },
                      required: ["h", "s", "l"],
                    },
                    accentColor: {
                      type: "object",
                      properties: {
                        h: { type: "number", description: "Hue 0-360" },
                        s: { type: "number", description: "Saturation 0-100" },
                        l: { type: "number", description: "Lightness 0-100" },
                      },
                      required: ["h", "s", "l"],
                    },
                    particleCount: {
                      type: "number",
                      description: "Number of particles (5-30)",
                    },
                    glowIntensity: {
                      type: "number",
                      description: "Glow blur amount (5-25)",
                    },
                    scale: {
                      type: "number",
                      description: "Overall size multiplier (0.5-2.0)",
                    },
                    speed: {
                      type: "number",
                      description: "Animation speed multiplier (0.5-3.0)",
                    },
                    description: {
                      type: "string",
                      description: "One sentence describing the visual effect",
                    },
                  },
                  required: [
                    "name",
                    "filterType",
                    "anchorPoint",
                    "animation",
                    "primaryColor",
                    "secondaryColor",
                    "accentColor",
                    "particleCount",
                    "glowIntensity",
                    "scale",
                    "speed",
                    "description",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_filter" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return filter parameters");
    }

    const filterParams = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ filter: filterParams }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-filter error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
