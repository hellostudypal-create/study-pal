import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/mailer";

const schema = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().min(1),
  html: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  const validApiKey = process.env.STUDY_PAL_API_KEY;

  if (!validApiKey || apiKey !== validApiKey) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to: parsed.data.to,
    subject: parsed.data.subject,
    html: parsed.data.html,
  });

  return NextResponse.json(result, { status: 201 });
}
