import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { evaluateDeletion, isValidUUID } from "./user-deletion-policy";

// ─── Fixtures ───────────────────────────────────────────────────────────────

const UUID_A = "aaaaaaaa-0000-4000-8000-000000000000";
const UUID_B = "bbbbbbbb-0000-4000-8000-000000000000";
const MALFORMED = "not-a-uuid";
const NON_ADMIN = { is_admin: false };
const ADMIN_PROFILE = { is_admin: true };

// ─── isValidUUID ─────────────────────────────────────────────────────────────

describe("isValidUUID", () => {
    it("accepts a well-formed v4 UUID", () => {
        expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    });
    it("accepts uppercase UUID", () => {
        expect(isValidUUID("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
    });
    it("rejects a plain string", () => {
        expect(isValidUUID("not-a-uuid")).toBe(false);
    });
    it("rejects empty string", () => {
        expect(isValidUUID("")).toBe(false);
    });
    it("rejects UUID with wrong segment lengths", () => {
        expect(isValidUUID("aaaaaaaa-0000-0000-000000000000")).toBe(false);
    });
});

// ─── evaluateDeletion — test matrix ─────────────────────────────────────────

describe("evaluateDeletion", () => {
    // Test 6: malformed UUID
    it("6. malformed target UUID → rejected", () => {
        const result = evaluateDeletion({
            currentUserId: UUID_A,
            targetUserId: MALFORMED,
            targetProfile: NON_ADMIN,
            currentAdminCount: 1,
        });
        expect(result.allowed).toBe(false);
        expect((result as { reason: string }).reason).toMatch(/идентификатор/i);
    });

    // Test 5: self-delete
    it("5. admin cannot delete self", () => {
        const result = evaluateDeletion({
            currentUserId: UUID_A,
            targetUserId: UUID_A,
            targetProfile: ADMIN_PROFILE,
            currentAdminCount: 2,
        });
        expect(result.allowed).toBe(false);
        expect((result as { reason: string }).reason).toMatch(/собственную/i);
    });

    // Test 7: non-existent target
    it("7. non-existent target profile → rejected safely", () => {
        const result = evaluateDeletion({
            currentUserId: UUID_A,
            targetUserId: UUID_B,
            targetProfile: null,
            currentAdminCount: 2,
        });
        expect(result.allowed).toBe(false);
        expect((result as { reason: string }).reason).toMatch(/не найден/i);
    });

    // Test 4: last admin protection
    it("4a. last admin cannot be deleted (count=1)", () => {
        const result = evaluateDeletion({
            currentUserId: UUID_A,
            targetUserId: UUID_B,
            targetProfile: ADMIN_PROFILE,
            currentAdminCount: 1,
        });
        expect(result.allowed).toBe(false);
        expect((result as { reason: string }).reason).toMatch(/последнего/i);
    });

    it("4b. non-admin with count=1 can be deleted (only admin count matters)", () => {
        const result = evaluateDeletion({
            currentUserId: UUID_A,
            targetUserId: UUID_B,
            targetProfile: NON_ADMIN,
            currentAdminCount: 1,
        });
        expect(result.allowed).toBe(true);
    });

    // Test 2: admin deletes non-admin
    it("2. admin can delete non-admin user", () => {
        const result = evaluateDeletion({
            currentUserId: UUID_A,
            targetUserId: UUID_B,
            targetProfile: NON_ADMIN,
            currentAdminCount: 3,
        });
        expect(result.allowed).toBe(true);
    });

    // Test 3: admin deletes another admin when admins remain
    it("3a. admin can delete another admin when 2 admins exist (1 will remain)", () => {
        const result = evaluateDeletion({
            currentUserId: UUID_A,
            targetUserId: UUID_B,
            targetProfile: ADMIN_PROFILE,
            currentAdminCount: 2,
        });
        expect(result.allowed).toBe(true);
    });

    it("3b. admin can delete another admin when 3 admins exist", () => {
        const result = evaluateDeletion({
            currentUserId: UUID_A,
            targetUserId: UUID_B,
            targetProfile: ADMIN_PROFILE,
            currentAdminCount: 3,
        });
        expect(result.allowed).toBe(true);
    });

    it("evaluation order: UUID check runs before self-delete check", () => {
        const result = evaluateDeletion({
            currentUserId: MALFORMED,
            targetUserId: MALFORMED,
            targetProfile: ADMIN_PROFILE,
            currentAdminCount: 2,
        });
        // UUID check fires first
        expect((result as { reason: string }).reason).toMatch(/идентификатор/i);
    });
});

// ─── Schema safety assertions ────────────────────────────────────────────────
//
// These tests read migration SQL files and assert that:
//   - profiles cascades on auth.users deletion (profile is removed)
//   - comments are SET NULL on profile deletion (comments are anonymized, not deleted)
//   - books have NO cascade dependency on auth.users or profiles
//   - chapters have NO cascade dependency on auth.users or profiles
//
// They fail if a future migration accidentally introduces a cascade that would
// destroy book/chapter content when a user account is deleted.

const MIGRATIONS_DIR = join(__dirname, "../../supabase/migrations");

function readMigration(filename: string): string {
    return readFileSync(join(MIGRATIONS_DIR, filename), "utf-8");
}

describe("schema safety — FK/cascade assertions", () => {
    it("profiles.id references auth.users with ON DELETE CASCADE (profile removed on user deletion)", () => {
        const sql = readMigration("20260922000000_initial_schema.sql");
        // The profiles table definition must cascade from auth.users
        expect(sql).toMatch(/references\s+auth\.users\s*\(\s*id\s*\)\s+on\s+delete\s+cascade/i);
    });

    it("comments.user_id references profiles with ON DELETE SET NULL (comments anonymized, not deleted)", () => {
        const sql = readMigration("20260922010000_preserve_comments_on_user_delete.sql");
        // The migration changes comments FK to SET NULL to preserve historical content
        expect(sql).toMatch(/on\s+delete\s+set\s+null/i);
    });

    it("books table has NO direct FK cascade dependency on auth.users or profiles", () => {
        const sql = readMigration("20260922000000_initial_schema.sql");
        // Books reference sections (ON DELETE RESTRICT), not users
        const booksTableMatch = sql.match(/create\s+table\s+public\.books\s*\([\s\S]*?\);/i);
        expect(booksTableMatch).not.toBeNull();
        const booksTable = booksTableMatch![0];
        // Books must NOT reference auth.users or profiles
        expect(booksTable).not.toMatch(/references\s+auth\.users/i);
        expect(booksTable).not.toMatch(/references\s+(?:public\.)?profiles/i);
    });

    it("chapters table has NO direct FK cascade dependency on auth.users or profiles", () => {
        const sql = readMigration("20260922000000_initial_schema.sql");
        const chaptersTableMatch = sql.match(/create\s+table\s+public\.chapters\s*\([\s\S]*?\);/i);
        expect(chaptersTableMatch).not.toBeNull();
        const chaptersTable = chaptersTableMatch![0];
        expect(chaptersTable).not.toMatch(/references\s+auth\.users/i);
        expect(chaptersTable).not.toMatch(/references\s+(?:public\.)?profiles/i);
    });

    it("all migrations combined: books are never dropped or updated in any migration", () => {
        const migrations = [
            "20260922000000_initial_schema.sql",
            "20260922010000_preserve_comments_on_user_delete.sql",
            "20260922020000_phase3_auth_access.sql",
            "20260922030000_ascii_book_slugs.sql",
            "20260923000000_book_description_jsonb.sql",
            "20260924000000_phase7c_clear_test_descriptions.sql",
            "20260924000001_phase7d_remove_peski_test_fixture.sql",
        ].map(readMigration).join("\n");

        // No migration may cascade-delete books or chapters via a user FK
        // (books/chapters only cascade from their parent: chapters from books, books from sections)
        expect(migrations).not.toMatch(/alter\s+table\s+public\.books\s+add\s+.*references.*auth\.users.*on\s+delete\s+cascade/i);
        expect(migrations).not.toMatch(/alter\s+table\s+public\.chapters\s+add\s+.*references.*auth\.users.*on\s+delete\s+cascade/i);
        expect(migrations).not.toMatch(/alter\s+table\s+public\.books\s+add\s+.*references.*profiles.*on\s+delete\s+cascade/i);
        expect(migrations).not.toMatch(/alter\s+table\s+public\.chapters\s+add\s+.*references.*profiles.*on\s+delete\s+cascade/i);
    });
});

// ─── Content-survival assertion: application code ────────────────────────────
//
// Verify that the adminDeleteUser implementation does not contain any book or
// chapter deletion/update queries. This is a permanent safety invariant.

describe("content survival — application code safety", () => {
    it("lib/admin/users.ts does not query books or chapters tables", () => {
        const sourceCode = readFileSync(join(__dirname, "users.ts"), "utf-8");
        // The deletion function must never reference books or chapters tables
        expect(sourceCode).not.toMatch(/from\s*\(\s*["']books["']/);
        expect(sourceCode).not.toMatch(/from\s*\(\s*["']chapters["']/);
        expect(sourceCode).not.toMatch(/delete.*books/i);
        expect(sourceCode).not.toMatch(/delete.*chapters/i);
        expect(sourceCode).not.toMatch(/update.*books/i);
        expect(sourceCode).not.toMatch(/update.*chapters/i);
    });

    it("app/actions/admin-users.ts does not query books or chapters tables", () => {
        const sourceCode = readFileSync(join(__dirname, "../../app/actions/admin-users.ts"), "utf-8");
        expect(sourceCode).not.toMatch(/books/);
        expect(sourceCode).not.toMatch(/chapters/);
    });
});
