import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendDoubleOptInEmail } from "@/lib/email/send";

// Basic in-memory rate limiter per IP: max 5 requests per 10 minutes
const ipRateLimits = new Map<string, { count: number; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || "").toString().trim().toLowerCase();
    const source = (body.source || "footer").toString().slice(0, 32);

    // 1. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail) || rawEmail.length > 254) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 2. IP rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const now = Date.now();
    const rateData = ipRateLimits.get(ip);

    if (rateData && rateData.expiresAt > now) {
      if (rateData.count >= 5) {
        return NextResponse.json(
          { error: "Too many subscription attempts. Please try again later." },
          { status: 429 }
        );
      }
      rateData.count++;
    } else {
      ipRateLimits.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    }

    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
    const userAgentHash = crypto.createHash("sha256").update(userAgent).digest("hex").slice(0, 16);
    const verificationToken = crypto.randomBytes(24).toString("hex");

    // 3. Upsert subscriber as pending
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: rawEmail },
    });

    if (existing && existing.status === "active") {
      // Compliance rule: never reveal whether an email already exists (show "Check your inbox" either way)
      return NextResponse.json({
        success: true,
        message: "If that email is valid, a confirmation link has been sent to your inbox.",
      });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: rawEmail },
      create: {
        email: rawEmail,
        status: "pending",
        source,
        token: verificationToken,
        ipHash,
        userAgentHash,
        consentAt: new Date(),
      },
      update: {
        status: "pending",
        token: verificationToken,
        source,
        ipHash,
        userAgentHash,
        consentAt: new Date(),
      },
    });

    // 4. Send Double Opt-In Email
    await sendDoubleOptInEmail({
      email: rawEmail,
      token: verificationToken,
    });

    return NextResponse.json({
      success: true,
      message: "Check your inbox! We sent you a confirmation link.",
    });
  } catch (err: any) {
    console.error("[Newsletter Subscribe Error]:", err);
    return NextResponse.json(
      { error: "Unable to process subscription right now. Please try again." },
      { status: 500 }
    );
  }
}
