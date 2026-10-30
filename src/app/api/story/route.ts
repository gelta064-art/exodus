import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

interface HistoryItem {
  sceneText: string;
  choiceText: string | null;
}

interface SceneResponse {
  title: string;
  text: string;
  choices: { id: string; text: string; tone: string }[];
  isEnding: boolean;
}

const SYSTEM_PROMPT = `You are the narrator of an interactive branching story inspired by the premise of "Death Note" — a supernatural notebook that can end lives, a shinigami (death god) who dropped it, and a cat-and-mouse pursuit between a brilliant student and an eccentric detective.

IMPORTANT: Write entirely ORIGINAL scenes and dialogue. Do NOT reproduce or closely paraphrase specific scenes, dialogue, or plot beats from the manga/anime. Use the character names and the core premise as our starting point, but create fresh scenarios that respond to the player's choices. The player's choices should meaningfully branch the story — they are writing their own version.

CHARACTERS (use these names):
- Light Yagami: a brilliant, prideful university student who finds the notebook
- Ryuk: a bored shinigami with apple addiction, drops the notebook for entertainment
- L: the world's greatest detective, eccentric and reclusive, pursues "Kira" (the killer)
- Soichiro Yagami: Light's father, chief of police, a man of unshakeable integrity
- Misa Amane: a famous model devoted to "Kira," with her own notebook
- Near & Mello: L's successors, rivals who split his legacy

NARRATIVE RULES:
- Each scene is 80-140 words of vivid, second-person narration ("You..." address the player AS Light).
- Inner monologue is welcome — show Light's reasoning, doubt, pride.
- End each scene with a dramatic beat or tension point.
- Provide exactly 3 choices that meaningfully diverge (not "yes/no/maybe" — give genuinely different moral/tactical paths).
- Each choice has a "tone" — one word: bold, cautious, cruel, clever, reckless, ruthless, merciful, defiant, manipulative, desperate.

If the story has reached a natural conclusion (Light is caught, killed, wins, or a major turning point), set isEnding: true and provide 0 choices.

Respond with ONLY a JSON object, no markdown:
{"title":string,"text":string,"choices":[{"id":"a|b|c","text":string,"tone":string}],"isEnding":boolean}`;

function extractJson(text: string): unknown {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

export async function POST(req: NextRequest) {
  try {
    const { history, choice } = (await req.json()) as {
      history: HistoryItem[];
      choice?: string;
    };

    const zai = await getZai();

    // Build the user message: if no history, it's the opening; otherwise continue
    let userContent: string;
    if (!history || history.length === 0) {
      userContent =
        "Begin the story. Light Yagami finds a black notebook labeled 'Death Note' dropped in the school courtyard. A shinigami named Ryuk appears. Set the opening scene and give the player their first three choices.";
    } else {
      const recap = history
        .map(
          (h, i) =>
            `Scene ${i + 1}: ${h.sceneText.slice(0, 200)}...\nPlayer chose: ${h.choiceText}`
        )
        .join("\n\n");
      userContent = `Story so far:\n${recap}\n\nThe player's latest choice: "${choice}".\n\nContinue the story. Generate the NEXT scene that flows from this choice. Show consequences, raise stakes, and provide 3 new choices.`;
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: SceneResponse;
    try {
      parsed = extractJson(raw) as SceneResponse;
    } catch {
      // Retry once
      const retry = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
          { role: "assistant", content: raw },
          {
            role: "user",
            content: "Respond with ONLY valid JSON now.",
          },
        ],
        thinking: { type: "disabled" },
      });
      parsed = extractJson(retry.choices[0]?.message?.content ?? "") as SceneResponse;
    }

    // Validate
    if (!parsed.text) throw new Error("No scene text returned");
    if (!parsed.choices) parsed.choices = [];
    if (!parsed.isEnding) parsed.isEnding = false;

    return NextResponse.json({ scene: parsed });
  } catch (err) {
    console.error("[story] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Story generation failed" },
      { status: 500 }
    );
  }
}
