import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, name } = await req.json();
    if (!phone || typeof phone !== "string" || phone.length < 5) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }
    const normalized = phone.trim();
    const existing = await db.select().from(users).where(sql`${users.phone} = ${normalized}`).limit(1);
    if (existing.length > 0) {
      const u = existing[0];
      await db.update(users).set({ lastActive: new Date() }).where(sql`${users.id} = ${u.id}`);
      return NextResponse.json({ user: u, created: false });
    }
    const inserted = await db.insert(users).values({
      phone: normalized,
      name: name || null,
      totalCorrect: 0,
      totalAnswered: 0,
      masteredCount: 0,
      isReady: false,
      practiceSession: 0,
    }).returning();
    return NextResponse.json({ user: inserted[0], created: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
