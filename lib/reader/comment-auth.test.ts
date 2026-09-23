import { describe, it, expect } from "vitest";
import { canDeleteComment } from "./comment-auth";

describe("canDeleteComment", () => {
    it("returns false for anonymous user (null profile)", () => {
        expect(canDeleteComment(null, "comment-owner-id")).toBe(false);
        expect(canDeleteComment(null, null)).toBe(false);
    });

    it("returns true when registered reader owns the comment", () => {
        expect(canDeleteComment({ id: "u1", is_admin: false }, "u1")).toBe(true);
    });

    it("returns false when registered reader tries to delete another user's comment", () => {
        expect(canDeleteComment({ id: "u1", is_admin: false }, "u2")).toBe(false);
    });

    it("returns false when registered reader tries to delete a comment from a deleted user (null userId)", () => {
        expect(canDeleteComment({ id: "u1", is_admin: false }, null)).toBe(false);
    });

    it("returns true when admin deletes another user's comment", () => {
        expect(canDeleteComment({ id: "admin1", is_admin: true }, "u2")).toBe(true);
    });

    it("returns true when admin deletes their own comment", () => {
        expect(canDeleteComment({ id: "admin1", is_admin: true }, "admin1")).toBe(true);
    });

    it("returns true when admin deletes a comment from a deleted user (null userId)", () => {
        expect(canDeleteComment({ id: "admin1", is_admin: true }, null)).toBe(true);
    });
});
