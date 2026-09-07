import { runStorylineGeneration } from "@/lib/storylines/generate";
import { clearStorylines } from "@/lib/storylines/db";

/**
 * Triggers storyline generation remotely (e.g. from a scheduled GitHub
 * Actions workflow, since Railway's base plan has no built-in cron).
 * Protected by a shared secret so this can't be spammed by strangers —
 * every Gemini call against the free tier counts.
 */
export async function POST(request: Request) {
  const secret = process.env.GENERATION_SECRET;
  if (!secret) {
    return Response.json(
      { error: "GENERATION_SECRET is not configured on the server" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runStorylineGeneration();
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}

/** TEMP: re-added briefly to re-test prompt tweaks; remove after verifying. */
export async function DELETE(request: Request) {
  const secret = process.env.GENERATION_SECRET;
  if (!secret) {
    return Response.json(
      { error: "GENERATION_SECRET is not configured on the server" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = clearStorylines();
  return Response.json({ deleted });
}
