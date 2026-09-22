import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "transmagia_section_access_";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

type SectionAccessPayload = {
    sectionId: string;
    expiresAt: number;
};

function getSecret(): string {
    const secret = process.env.SUPABASE_ACCESS_COOKIE_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("SUPABASE_ACCESS_COOKIE_SECRET must contain at least 32 characters.");
    }
    return secret;
}

function getTtlSeconds(): number {
    const configured = Number(process.env.SECTION_ACCESS_TTL_SECONDS ?? DEFAULT_TTL_SECONDS);
    return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_TTL_SECONDS;
}

function cookieName(sectionId: string): string {
    return `${COOKIE_PREFIX}${sectionId}`;
}

function sign(payload: string): string {
    return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encode(payload: SectionAccessPayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${body}.${sign(body)}`;
}

function decode(value: string): SectionAccessPayload | null {
    const [body, signature] = value.split(".");
    if (!body || !signature) {
        return null;
    }

    const expected = sign(body);
    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
        receivedBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
        return null;
    }

    try {
        const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SectionAccessPayload>;
        if (
            typeof parsed.sectionId !== "string" ||
            typeof parsed.expiresAt !== "number" ||
            !Number.isInteger(parsed.expiresAt)
        ) {
            return null;
        }
        return { sectionId: parsed.sectionId, expiresAt: parsed.expiresAt };
    } catch {
        return null;
    }
}

export async function hasValidSectionAccess(sectionId: string): Promise<boolean> {
    const value = (await cookies()).get(cookieName(sectionId))?.value;
    if (!value) {
        return false;
    }

    const payload = decode(value);
    return Boolean(
        payload &&
        payload.sectionId === sectionId &&
        payload.expiresAt > Math.floor(Date.now() / 1000),
    );
}

export async function grantSectionAccess(sectionId: string): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + getTtlSeconds();
    (await cookies()).set(cookieName(sectionId), encode({ sectionId, expiresAt }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(expiresAt * 1000),
    });
}

export function sectionAccessCookieNameForTests(sectionId: string): string {
    return cookieName(sectionId);
}
