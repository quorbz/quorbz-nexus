import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../lib/api';

type Step = 'request' | 'verify';

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [sessionId, setSessionId] = useState('');
  const [chatId, setChatId] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ sessionId: string }>('/auth/request-otp', { chatId });
      setSessionId(res.sessionId);
      setStep('verify');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>('/auth/verify-otp', { sessionId, otp });
      setToken(res.token);
      navigate('/');
    } catch {
      setError('Incorrect or expired code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-brand-400 font-bold text-2xl tracking-widest">QUORBZ</span>
          <div className="text-gray-500 text-sm mt-1">NEXUS — Mission Control</div>
        </div>

        <div className="card">
          {step === 'request' ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Your Telegram Chat ID</label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="e.g. 8711488487"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white rounded py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send login code via Telegram'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <p className="text-sm text-gray-400">
                A 6-digit code was sent to your Telegram. Enter it below.
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center text-xl tracking-widest font-mono text-gray-100 focus:outline-none focus:border-brand-500"
                required
                autoFocus
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white rounded py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify code'}
              </button>
              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-gray-500 hover:text-gray-300 text-sm"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
