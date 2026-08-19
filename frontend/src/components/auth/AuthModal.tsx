import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { Dna, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { login, register, error, clearError } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (isRegistering && !name.trim()) {
      setLocalError('Please provide your researcher name.');
      return;
    }

    try {
      setLoading(true);
      if (isRegistering) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      onSuccess?.();
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md animate-scale-in">
        <PixelPanel
          variant="wood"
          header={
            <div className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="font-pixel text-xs text-amber-300">
                {isRegistering ? 'RESEARCHER ENROLLMENT' : 'STATION ACCESS TERMINAL'}
              </span>
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            {/* Logo / Subtitle */}
            <div className="text-center">
              <h2 className="font-pixel text-base text-amber-400 tracking-wide">
                BIO-TECH QUIZ-QUEST
              </h2>
              <p className="font-clean text-xs text-amber-100/70 mt-1">
                {isRegistering
                  ? 'Create your research profile to begin exploring Omics labs.'
                  : 'Enter your researcher credentials to access the laboratory.'}
              </p>
            </div>

            {/* Error Message Alert */}
            {(localError || error) && (
              <div className="p-3 bg-red-950/80 border-2 border-red-600 text-red-200 text-xs flex items-center gap-2 rounded">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{localError || error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {isRegistering && (
                <div className="flex flex-col gap-1">
                  <label className="font-pixel text-[10px] text-amber-300/90">
                    RESEARCHER NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Jane Helix"
                    className="w-full px-3 py-2 bg-[#1b0f09] border-2 border-[#5c3a22] text-[#f7eedb] text-sm focus:border-cyan-400 outline-none rounded-none"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[10px] text-amber-300/90">
                  INSTITUTIONAL EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@biotech.ac.in"
                  className="w-full px-3 py-2 bg-[#1b0f09] border-2 border-[#5c3a22] text-[#f7eedb] text-sm focus:border-cyan-400 outline-none rounded-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[10px] text-amber-300/90">
                  SECURITY KEY / PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-[#1b0f09] border-2 border-[#5c3a22] text-[#f7eedb] text-sm focus:border-cyan-400 outline-none rounded-none"
                />
              </div>

              <PixelButton
                type="submit"
                variant="amber"
                size="lg"
                disabled={loading}
                className="mt-2 w-full"
                icon={isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              >
                {loading ? 'AUTHENTICATING...' : isRegistering ? 'ENROLL AS STUDENT' : 'LOGIN TO STATION'}
              </PixelButton>
            </form>

            {/* Toggle Mode */}
            <div className="text-center pt-2 border-t border-amber-900/40">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering((prev) => !prev);
                  setLocalError(null);
                  clearError();
                }}
                className="font-clean text-xs text-cyan-300 hover:text-cyan-200 hover:underline cursor-pointer"
              >
                {isRegistering
                  ? 'Already registered? Click here to Login'
                  : 'New student? Click here to Register'}
              </button>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
};
