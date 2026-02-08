import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import appLogo from '@/assets/app-logo.png';

export const AuthPage = () => {
  const { signInWithApple, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in with Apple');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try signing in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created! Check your email to verify your account.');
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset link sent! Check your email.');
        setIsForgotPassword(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password View
  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-card shadow-md border border-border flex items-center justify-center mx-auto mb-6 overflow-hidden">
              <img src={appLogo} alt="Expense Tracker" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Reset Password
            </h1>
            <p className="text-muted-foreground mt-2">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                disabled={loading || isSubmitting}
                className="w-full h-12 text-base font-semibold"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </div>

          <button
            onClick={() => setIsForgotPassword(false)}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Title */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-card shadow-md border border-border flex items-center justify-center mx-auto mb-6 overflow-hidden">
            <img src={appLogo} alt="Expense Tracker" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Expense Tracker
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your spending, one expense at a time
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-card rounded-2xl p-6 shadow-lg space-y-6">
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp ? 'Sign up to start tracking expenses' : 'Sign in to sync your expenses'}
            </p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full h-12 text-base font-semibold"
            >
              {isSubmitting ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading || isSubmitting}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              onClick={handleAppleSignIn}
              disabled={loading || isSubmitting}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Sign in with Apple
            </Button>
          </div>

          {!isSignUp && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-sm text-primary hover:underline w-full text-right"
            >
              Forgot password?
            </button>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword('');
              }}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Your data is securely stored and synced across devices
        </p>
      </div>
    </div>
  );
};
