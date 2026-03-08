export async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as unknown as BufferSource,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

function bufferToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

export async function encryptData(data: unknown, password: string): Promise<{ encrypted: string; salt: string; iv: string }> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);

    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedData
    );

    return {
        encrypted: bufferToBase64(new Uint8Array(encrypted)),
        salt: bufferToBase64(salt),
        iv: bufferToBase64(iv),
    };
}

export async function decryptData<T>(encryptedBase64: string, password: string, saltBase64: string, ivBase64: string): Promise<T> {
    const salt = new Uint8Array(base64ToBuffer(saltBase64));
    const iv = new Uint8Array(base64ToBuffer(ivBase64));
    const encrypted = new Uint8Array(base64ToBuffer(encryptedBase64));

    const key = await deriveKey(password, salt);

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encrypted
        );
        const dec = new TextDecoder();
        return JSON.parse(dec.decode(decrypted)) as T;
    } catch (e) {
        throw new Error("Invalid password or corrupted data");
    }
}
