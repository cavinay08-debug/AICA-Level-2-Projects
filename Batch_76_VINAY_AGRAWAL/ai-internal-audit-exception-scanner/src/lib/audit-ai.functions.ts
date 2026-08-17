import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  summary: z.string().min(1).max(20000),
});

/**
 * AI audit observations. The AI key lives only in server-side environment
 * configuration and is never shipped to the browser.
 */
export const generateAuditObservations = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("AI service is not configured on the server.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are assisting a chartered accountant's internal audit team. Write concise audit observations for the exceptions provided. Rules: never allege fraud or wrongdoing; use the terms 'exception', 'risk indicator' or 'requires review'; state that auditor confirmation is mandatory; suggest practical verification steps. Output 4-7 short bullet points in plain text.",
          },
          { role: "user", content: data.summary },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        response.status === 429
          ? "AI rate limit reached. Please retry in a moment."
          : `AI service error (${response.status}): ${detail.slice(0, 200)}`,
      );
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("AI service returned an empty response.");
    return { observations: content };
  });
