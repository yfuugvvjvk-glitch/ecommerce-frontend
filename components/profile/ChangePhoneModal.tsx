'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { X } from 'lucide-react';

interface ChangePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone: string;
  onSuccess: () => void;
}

export default function ChangePhoneModal({ isOpen, onClose, currentPhone, onSuccess }: ChangePhoneModalProps) {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [newPhone, setNewPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('input');
      setNewPhone('');
      setCode(['', '', '', '', '', '']);
      setError('');
      setRemainingAttempts(null);
    }
  }, [isOpen]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPhone || newPhone.length < 10) {
      setError('Vă rugăm să introduceți un număr de telefon valid (minim 10 caractere).');
      return;
    }

    if (newPhone === currentPhone) {
      setError('Noul număr de telefon nu poate fi identic cu cel curent.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      await apiClient.post('/api/user/change-phone', { newPhone });
      
      setStep('verify');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Eroare la trimiterea codului. Vă rugăm să încercați din nou.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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

    if (value && index < 5) {
      const nextInput = document.getElementById(`phone-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`phone-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Vă rugăm să introduceți toate cele 6 cifre.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await apiClient.post('/api/user/verify-phone-change', {
        code: verificationCode,
      });

      if (response.data.success) {
        alert('Număr de telefon schimbat cu succes!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Cod invalid. Vă rugăm să încercați din nou.';
      setError(errorMessage);
      
      if (err.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.response.data.remainingAttempts);
      }
      
      setCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('phone-code-0');
      firstInput?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {step === 'input' ? 'Schimbă Telefon' : 'Verificare Telefon'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="mt-1">
                Mai aveți {remainingAttempts} {remainingAttempts === 1 ? 'încercare' : 'încercări'}.
              </p>
            )}
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon curent
              </label>
              <input
                type="tel"
                value={currentPhone || 'Nesetat'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon nou *
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+40..."
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">📧 Notă:</p>
              <p>Veți primi un cod de verificare la adresa dvs. de email.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Se trimite...' : 'Trimite cod'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Am trimis un cod de verificare la email-ul dvs.
              </p>
              <p className="text-blue-600 font-semibold mt-1">Noul telefon: {newPhone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Introduceți codul de 6 cifre
              </label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`phone-code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Înapoi
              </button>
              <button
                type="submit"
                disabled={isLoading || code.some(d => !d)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Verificare...' : 'Verifică'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
