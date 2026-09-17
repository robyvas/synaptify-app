import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { LogIn, AlertTriangle } from 'lucide-react';
import { auth, googleProvider } from '../src/lib/firebase';

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError('Nu s-a putut face autentificarea. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="bg-gradient-to-br from-purple-900/60 to-zinc-900 w-16 h-16 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-500/20 flex items-center justify-center p-1 mx-auto mb-6">
          <img src="/logo.png" alt="Synaptify Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2 tracking-tighter">Synaptify</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Autentifică-te cu contul Google pentru a accesa datele financiare și CRM-ul.
        </p>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-purple-900/20 transition-all"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Se conectează...' : 'Sign in with Google'}</span>
        </button>

        {error && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
