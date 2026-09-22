import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

function deriveKey(
    password: string,
    salt: Buffer,
    keyLength: number,
    options: { N: number; r: number; p: number },
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(derivedKey as Buffer);
        });
    });
}

type StoredPassword = {
    cost: number;
    blockSize: number;
    parallelization: number;
    salt: Buffer;
    hash: Buffer;
};

function parseStoredPassword(value: string): StoredPassword | null {
    const [scheme, cost, blockSize, parallelization, saltHex, hashHex] = value.split("$");
    if (scheme !== "scrypt" || !cost || !blockSize || !parallelization || !saltHex || !hashHex) {
        return null;
    }

    const parsed = {
        cost: Number(cost),
        blockSize: Number(blockSize),
        parallelization: Number(parallelization),
        salt: Buffer.from(saltHex, "hex"),
        hash: Buffer.from(hashHex, "hex"),
    };

    if (
        !Number.isSafeInteger(parsed.cost) ||
        !Number.isSafeInteger(parsed.blockSize) ||
        !Number.isSafeInteger(parsed.parallelization) ||
        parsed.salt.length < 16 ||
        parsed.hash.length !== KEY_LENGTH
    ) {
        return null;
    }

    return parsed;
}

export async function hashSectionPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
    });

    return [
        "scrypt",
        SCRYPT_COST,
        SCRYPT_BLOCK_SIZE,
        SCRYPT_PARALLELIZATION,
        salt.toString("hex"),
        derivedKey.toString("hex"),
    ].join("$");
}

export async function verifySectionPassword(password: string, storedHash: string): Promise<boolean> {
    const parsed = parseStoredPassword(storedHash);
    if (!parsed) {
        return false;
    }

    const derivedKey = await deriveKey(password, parsed.salt, parsed.hash.length, {
        N: parsed.cost,
        r: parsed.blockSize,
        p: parsed.parallelization,
    });

    return timingSafeEqual(parsed.hash, derivedKey);
}
