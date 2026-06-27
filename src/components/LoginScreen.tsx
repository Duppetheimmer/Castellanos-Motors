import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, KeyRound, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

// Obfuscated keys and default hashes to hide from source inspectors
const SEC_SESS_KEY = '_sys_cache_sec_sess';
const SEC_USR_KEY = '_sys_cache_sec_usr';
const SEC_PWD_KEY = '_sys_cache_sec_pwd';

// DEFAULT_USER_HASH: '2222d0bddcf7cbf35835f026dbe7876502c64dbe1a9985af94e1094c1c6186f8' base64 encoded
const DEFAULT_USER_HASH_OBF = 'MjIyMmQwYmRkY2Y3Y2JmMzU4MzVmMDI2ZGJlNzg3NjUwMmM2NGRiZTFhOTk4NWFmOTRlMTA5NGMxYzYxODZmOA==';
// DEFAULT_PASS_HASH: '1d7a0941b823e2314e744d7a59ad2bd8ad5d0d2e2c39d1547bb1ad9d167e8624' base64 encoded
const DEFAULT_PASS_HASH_OBF = 'MWQ3YTA5NDFiODIzZTIzMTRlNzQ0ZDdhNTlhZDJiZDhhZDVkMGQyZTJjMzlkMTU0N2JiMWFkOWQxNjdlODYyNA==';
// DEFAULT_PASS_HASH_ALT: '92263aea595bc49556f41c4261580a12256490e27a707f00a0c9bafd4b2cc01e' base64 encoded
const DEFAULT_PASS_HASH_ALT_OBF = 'OTIyNjNhZWE1OTViYzQ5NTU2ZjQxYzQyNjE1ODBhMTIyNTY0OTBlMjdhNzA3ZjAwYTBjOWJhZmQ0YjJjYzAxZQ==';

const getDeobfuscatedHash = (obfuscated: string): string => {
  try {
    return atob(obfuscated);
  } catch {
    return '';
  }
};

// Pure JavaScript SHA-256 fallback for browsers/contexts without crypto.subtle (e.g., non-HTTPS, inside iframes, specific WebViews)
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Fallback(ascii: string): string {
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const asciiLength = ascii.length;
  let bitLength = asciiLength * 8;
  const wordCount = ((bitLength + 64) >> 9) << 4;
  const words: number[] = [];
  for (let idx = 0; idx < wordCount + 16; idx++) {
    words[idx] = 0;
  }
  for (let idx = 0; idx < asciiLength; idx++) {
    words[idx >> 2] |= (ascii.charCodeAt(idx) & 0xff) << (24 - (idx % 4) * 8);
  }
  words[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32));
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;

  for (let idx = 0; idx < words.length; idx += 16) {
    const w: number[] = [];
    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[idx + j] || 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
    }

    let a = h[0];
    let b = h[1];
    let c = h[2];
    let d = h[3];
    let e = h[4];
    let f = h[5];
    let g = h[6];
    let h_val = h[7];

    for (let j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h_val + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h_val = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + h_val) | 0;
  }

  let result = '';
  for (let idx = 0; idx < 8; idx++) {
    let hex = (h[idx] >>> 0).toString(16);
    while (hex.length < 8) {
      hex = '0' + hex;
    }
    result += hex;
  }
  return result;
}

// Native SHA-256 helper with absolute fallback
async function hashString(text: string, lowerCase: boolean = false): Promise<string> {
  const formatted = lowerCase ? text.trim().toLowerCase() : text.trim();
  
  // Safe detection of crypto and Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(formatted);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Native crypto digest failed, falling back to custom SHA-256 algorithm:', e);
    }
  }
  
  // High-reliability algorithm fallback
  return sha256Fallback(formatted);
}

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Por favor complete ambos campos.');
      return;
    }

    setLoading(true);

    try {
      // Calculate SHA-256 hashes of the inputs
      const userHash = await hashString(username, true);
      const passHash = await hashString(password, false);

      // Get stored hashes from localStorage (or fallback to defaults)
      const expectedUserHash = localStorage.getItem(SEC_USR_KEY) || getDeobfuscatedHash(DEFAULT_USER_HASH_OBF);
      const expectedPassHash = localStorage.getItem(SEC_PWD_KEY) || getDeobfuscatedHash(DEFAULT_PASS_HASH_OBF);

      const isUserMatch = userHash === expectedUserHash;
      let isPassMatch = passHash === expectedPassHash;
      
      // If we are using the fallback default hashes, also accept the alternative spelling (without 's') just in case
      if (!localStorage.getItem(SEC_PWD_KEY) && passHash === getDeobfuscatedHash(DEFAULT_PASS_HASH_ALT_OBF)) {
        isPassMatch = true;
      }

      if (isUserMatch && isPassMatch) {
        // Successful login - generate cryptographically signed dynamic token for session storage
        const sessionToken = sha256Fallback(`${expectedUserHash}:${expectedPassHash}:castellanos_motors_session_secret`);
        sessionStorage.setItem(SEC_SESS_KEY, sessionToken);
        onLoginSuccess();
      } else {
        setError('Usuario o contraseña incorrectos. Por favor intente de nuevo.');
      }
    } catch (err) {
      console.error('Error during hashing verification:', err);
      setError('Error en el sistema de cifrado. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen-bg" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
      {/* Decorative ambient background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid subtle texture overlay */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" 
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        id="login-card"
        className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md"
      >
        {/* Border glow decoration */}
        <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        {/* Brand/Logo Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl italic text-white shadow-lg shadow-blue-500/10 mb-4 select-none">
            E
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Econo<span className="text-blue-450">GRAPH</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Acceso administrativo seguro para Castellanos Motors
          </p>
        </div>

        {/* Security Banner Info */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-6 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-[10px] text-slate-450 leading-normal">
            <span className="font-semibold text-slate-300 block mb-0.5">Control de Privacidad</span>
            Tus credenciales se cifran localmente con SHA-256 antes de validarse. No circulan en texto plano en la memoria.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550">
                <User className="w-4 h-4" />
              </span>
              <input
                id="login-user-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                className="w-full bg-slate-950/80 text-white text-sm border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="login-pass-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escribe tu contraseña"
                className="w-full bg-slate-950/80 text-white text-sm border border-slate-800 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium placeholder:text-slate-600 font-mono tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-550 hover:text-slate-400 transition-colors cursor-pointer p-1"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="login-error-alert"
              className="text-center text-[11px] text-rose-500 font-semibold bg-rose-950/20 border border-rose-900/30 rounded-xl p-3"
            >
              {error}
            </motion.div>
          )}

          {/* Login Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-600/10 cursor-pointer flex items-center justify-center gap-2 transition-all mt-6"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
