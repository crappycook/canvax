export interface CryptoService {
  // Encryption/decryption
  encrypt(data: string, key?: string): Promise<string>
  decrypt(encryptedData: string, key?: string): Promise<string>
  
  // Hashing
  hash(data: string): Promise<string>
  
  // Key management
  generateKey(): Promise<string>
  deriveKey(password: string, salt: string): Promise<string>
  
  // Secure storage
  secureStore(key: string, value: string): Promise<void>
  secureRetrieve(key: string): Promise<string | null>
}

export class WebCryptoService implements CryptoService {
  private algorithm = 'AES-GCM'
  
  private async getCrypto(): Promise<Crypto> {
    return crypto
  }

  async encrypt(data: string, key?: string): Promise<string> {
    const crypto = await this.getCrypto()
    
    // Generate a random key if one is not provided
    let cryptoKey: CryptoKey
    if (key) {
      const encoder = new TextEncoder()
      const keyData = encoder.encode(key.substring(0, 32).padEnd(32, '0'))
      cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: this.algorithm },
        false,
        ['encrypt']
      )
    } else {
      cryptoKey = await crypto.subtle.generateKey(
        { name: this.algorithm, length: 256 },
        true,
        ['encrypt', 'decrypt']
      )
    }
    
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(data)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      cryptoKey,
      dataBytes
    )
    
    // Combine IV and encrypted data
    const encryptedArray = new Uint8Array(encrypted)
    const result = new Uint8Array(iv.length + encryptedArray.length)
    result.set(iv)
    result.set(encryptedArray, iv.length)
    
    return btoa(String.fromCharCode(...result))
  }

  async decrypt(encryptedData: string, key?: string): Promise<string> {
    const crypto = await this.getCrypto()
    
    // Decode the base64 data
    const encryptedBytes = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    )
    
    // Extract IV (first 12 bytes)
    const iv = encryptedBytes.slice(0, 12)
    const data = encryptedBytes.slice(12)
    
    let cryptoKey: CryptoKey
    if (key) {
      const encoder = new TextEncoder()
      const keyData = encoder.encode(key.substring(0, 32).padEnd(32, '0'))
      cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: this.algorithm },
        false,
        ['decrypt']
      )
    } else {
      // This should be handled better in production
      throw new Error('Key required for decryption')
    }
    
    const decrypted = await crypto.subtle.decrypt(
      { name: this.algorithm, iv },
      cryptoKey,
      data
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  async hash(data: string): Promise<string> {
    const crypto = await this.getCrypto()
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(data)
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
  }

  async generateKey(): Promise<string> {
    const crypto = await this.getCrypto()
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
  }

  async deriveKey(password: string, salt: string): Promise<string> {
    const crypto = await this.getCrypto()
    const encoder = new TextEncoder()
    
    const passwordBuffer = encoder.encode(password)
    const saltBuffer = encoder.encode(salt)
    
    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    )
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      { name: this.algorithm, length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    const exported = await crypto.subtle.exportKey('raw', derivedKey)
    return btoa(String.fromCharCode(...new Uint8Array(exported)))
  }

  async secureStore(key: string, value: string): Promise<void> {
    // In a real implementation, this would use secure storage
    // For MVP, we'll use localStorage as a fallback
    localStorage.setItem(`secure_${key}`, value)
  }

  async secureRetrieve(key: string): Promise<string | null> {
    // In a real implementation, this would use secure storage
    // For MVP, we'll use localStorage as a fallback
    return localStorage.getItem(`secure_${key}`)
  }
}

export const cryptoService = new WebCryptoService()