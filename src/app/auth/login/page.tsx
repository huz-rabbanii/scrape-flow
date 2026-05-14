'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, Loader2, Zap } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Sign In
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">ScrapeFlow</span>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Form with Suspense */}
        <Suspense fallback={
          <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Guest access */}
        <div className="mt-4 text-center">
          <Link 
            href="/dashboard" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Continue as guest →
          </Link>
        </div>
      </div>
    </div>
  );
}
