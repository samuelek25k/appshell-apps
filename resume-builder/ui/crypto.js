export class CredentialVault {
  constructor() {
    this.keyCache = new Map();
  }

  async _getEncryptionKey() {
    let keyMaterial = localStorage.getItem('__rb_vault_m');
    if (!keyMaterial) {
      const buffer = new Uint8Array(32);
      crypto.getRandomValues(buffer);
      keyMaterial = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('__rb_vault_m', keyMaterial);
    }
    const encoder = new TextEncoder();
    const rawKey = encoder.encode(keyMaterial);
    return await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(plaintext) {
    if (!plaintext) return '';
    const key = await this._getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    const pack = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext))
    };
    return btoa(JSON.stringify(pack));
  }

  async decrypt(encryptedPack) {
    if (!encryptedPack) return '';
    try {
      const { iv, data } = JSON.parse(atob(encryptedPack));
      const key = await this._getEncryptionKey();
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        new Uint8Array(data)
      );
      return new TextDecoder().decode(decrypted);
    } catch (err) {
      console.warn('Failed to decrypt stored credential', err);
      return '';
    }
  }

  async setKey(providerId, apiKey, sdk = null) {
    this.keyCache.set(providerId, apiKey);
    if (sdk?.secrets?.set) {
      try {
        await sdk.secrets.set(`${providerId}_api_key`, apiKey);
        return;
      } catch (e) {
        console.warn('sdk.secrets.set unavailable, falling back to AES-GCM vault', e);
      }
    }
    const encrypted = await this.encrypt(apiKey);
    localStorage.setItem(`__rb_sec_${providerId}`, encrypted);
  }

  async getKey(providerId, sdk = null) {
    if (this.keyCache.has(providerId)) {
      return this.keyCache.get(providerId);
    }
    if (sdk?.secrets?.get) {
      try {
        const val = await sdk.secrets.get(`${providerId}_api_key`);
        if (val) {
          this.keyCache.set(providerId, val);
          return val;
        }
      } catch (e) {
        console.warn('sdk.secrets.get unavailable, reading from AES-GCM vault', e);
      }
    }
    const raw = localStorage.getItem(`__rb_sec_${providerId}`);
    if (!raw) return '';
    const decrypted = await this.decrypt(raw);
    if (decrypted) this.keyCache.set(providerId, decrypted);
    return decrypted;
  }

  async clearKey(providerId, sdk = null) {
    this.keyCache.delete(providerId);
    if (sdk?.secrets?.delete) {
      try { await sdk.secrets.delete(`${providerId}_api_key`); } catch {}
    }
    localStorage.removeItem(`__rb_sec_${providerId}`);
  }
}

export const vault = new CredentialVault();
