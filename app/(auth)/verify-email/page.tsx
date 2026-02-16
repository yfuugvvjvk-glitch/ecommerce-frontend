'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setCode(newCode);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    const lastInput = document.getElementById(`code-${lastIndex}`);
    lastInput?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Vă rugăm să introduceți toate cele 6 cifre.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await apiClient.post('/api/auth/verify-email', {
        email,
        code: verificationCode,
      });

      if (response.data.success) {
        setSuccess(true);
        
        // Save token and user
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Cod invalid. Vă rugăm să încercați din nou.';
      setError(errorMessage);
      
      if (err.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.response.data.remainingAttempts);
      }
      
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('code-0');
      firstInput?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setCanResend(false);
      setResendCooldown(60);
      setError('');

      await apiClient.post('/api/auth/resend-email-code', { email });
      
      setError('');
      alert('Un nou cod de verificare a fost trimis pe email!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Eroare la trimiterea codului. Vă rugăm să încercați din nou.';
      setError(errorMessage);
      setCanResend(true);
      setResendCooldown(0);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg text-center w-full max-w-md mx-auto">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Email verificat cu succes!</h2>
        <p className="text-gray-600">Vă redirecționăm către dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Verificare Email</h1>
        <p className="text-gray-600 text-sm">
          Am trimis un cod de verificare la adresa:
        </p>
        <p className="text-blue-600 font-semibold mt-1">{email}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
          {error}
          {remainingAttempts !== null && remainingAttempts > 0 && (
            <p className="mt-1 text-sm">
              Mai aveți {remainingAttempts} {remainingAttempts === 1 ? 'încercare' : 'încercări'}.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Introduceți codul de 6 cifre
          </label>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || code.some(d => !d)}
          className="w-full py-3 px-4 text-base font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Verificare...' : 'Verifică Email'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Nu ați primit codul?
        </p>
        <button
          onClick={handleResendCode}
          disabled={!canResend}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canResend ? 'Retrimite codul' : `Retrimite în ${resendCooldown}s`}
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => router.push('/register')}
          className="text-gray-600 hover:text-gray-700 text-sm"
        >
          ← Înapoi la înregistrare
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Se încarcă...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
