'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/lib/validations';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '' };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength, label: labels[strength] };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true);
      setError('');
      await registerUser(data.email, data.password, data.name);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg text-center w-full max-w-md mx-auto">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Registration Successful!</h2>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">📝 Register</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-invalid={errors.name ? 'true' : 'false'}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            id="password"
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-invalid={errors.password ? 'true' : 'false'}
          />
          {password && passwordStrength.strength > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      level <= passwordStrength.strength
                        ? level <= 2
                          ? 'bg-red-500'
                          : level === 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Password strength: {passwordStrength.label}
              </p>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 text-base font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
        >
          {isLoading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Login
        </a>
      </p>
    </div>
  );
}
