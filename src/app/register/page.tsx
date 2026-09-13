'use client';

import React, { FormEvent, useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNameError(''); setEmailError(''); setPasswordError(''); setConfirmError(''); setGeneralError('');

    if (!fullName.trim()) return setNameError('Full name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setEmailError('Enter a valid email.');
    if (password.length < 6) return setPasswordError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setConfirmError('Passwords do not match.');
    if (!terms) return alert('You must accept Terms & Conditions');

    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim(), role || 'user');
      setSuccess(true);
      setTimeout(() => router.replace(role === 'host' ? '/host' : '/explore'), 1500);
    } catch (err) {
      setGeneralError((err as Error).message);
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-transparent border-none py-3 px-12 text-sm font-semibold outline-none';

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-7 overflow-hidden relative">
      <div className="w-full max-w-[420px] relative z-10">
        <div className="glass-card rounded-[35px] px-8 py-7 shadow-xl dark:shadow-none transition-all hover:-translate-y-1 relative">
          <div className="text-center mb-5">
            <div className="w-[50px] h-[50px] mx-auto mb-3 bg-primary-light rounded-full flex items-center justify-center text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Join VillaVista</h1>
            <p className="text-[13px] text-ink-muted max-w-[320px] mx-auto mt-1 leading-snug">
              Create an account to start booking unique homestays and luxury villas, or register as a host to list your property and start earning.
            </p>
          </div>

          <form onSubmit={submit} noValidate>
            <div className="mb-3.5">
              <div className="input-glass rounded-xl relative flex items-center focus-within:border-primary dark:focus-within:border-white focus-within:shadow-[0_0_0_4px_rgba(128,0,32,0.1)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 absolute left-5 text-ink-muted">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
                </svg>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your Full Name:" className={inputCls} />
              </div>
              {nameError && <p className="text-primary text-[11px] mt-1.5">{nameError}</p>}
            </div>

            <div className="mb-3.5">
              <div className="input-glass rounded-xl relative flex items-center focus-within:border-primary dark:focus-within:border-white focus-within:shadow-[0_0_0_4px_rgba(128,0,32,0.1)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 absolute left-5 text-ink-muted">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter E-mail address:" className={inputCls} />
              </div>
              {emailError && <p className="text-primary text-[11px] mt-1.5">{emailError}</p>}
            </div>

            <div className="mb-3.5">
              <div className="input-glass rounded-xl relative flex items-center focus-within:border-primary dark:focus-within:border-white focus-within:shadow-[0_0_0_4px_rgba(128,0,32,0.1)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 absolute left-5 text-ink-muted">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password:" className={inputCls} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-primary hover:scale-110 transition-all">
                  {showPassword ? '🙈' : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="text-primary text-[11px] mt-1.5">{passwordError}</p>}
            </div>

            <div className="mb-3.5">
              <div className="input-glass rounded-xl relative flex items-center focus-within:border-primary dark:focus-within:border-white focus-within:shadow-[0_0_0_4px_rgba(128,0,32,0.1)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 absolute left-5 text-ink-muted">
                  <path d="M12 17a5 5 0 0 0 5-5V7a5 5 0 0 0-10 0v5a5 5 0 0 0 5 5z" />
                </svg>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password:" className={inputCls} />
              </div>
              {confirmError && <p className="text-primary text-[11px] mt-1.5">{confirmError}</p>}
            </div>

            <div className="mb-4">
              <div className="input-glass rounded-xl relative">
                <select value={role} onChange={(e) => setRole(e.target.value)} required className="w-full bg-transparent border-none py-3.5 px-6 text-sm font-semibold outline-none cursor-pointer appearance-none">
                  <option value="">Select Role</option>
                  <option value="user">User</option>
                  <option value="host">Host</option>
                </select>
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted pointer-events-none">▼</span>
              </div>
            </div>

            <div className="flex items-center mb-6">
              <label className="flex items-center gap-3 cursor-pointer select-none text-[13px] text-ink-muted leading-tight">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="w-4 h-4 accent-primary dark:accent-white" />
                <b className="font-medium">
                  I agree to the <a href="#" className="text-primary font-bold no-underline hover:underline">Terms & Conditions</a>
                </b>
              </label>
            </div>

            {generalError && <p className="text-primary text-xs mb-3 text-center">{generalError}</p>}

            <button type="submit" disabled={loading} className="w-full bg-primary border-none rounded-xl py-4 text-white text-[16px] font-bold cursor-pointer mb-5 shadow-glow transition-all hover:bg-primary-hover hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-3">
              <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
              {loading && <span className="neu-spinner !w-5 !h-5 !border-2" />}
            </button>
          </form>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line dark:border-white/10"></div></div>
            <span className="relative bg-white/20 dark:bg-black/20 backdrop-blur-md px-4 text-[11px] font-bold text-ink-muted uppercase tracking-widest text-center">or sign up with</span>
          </div>

          <div className="flex justify-center gap-5 mb-5">
            <SocialButton icon={
              <React.Fragment>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </React.Fragment>
            } />
            <SocialButton icon={<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />} />
            <SocialButton icon={<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="#1DA1F2" />} />
          </div>

          <p className="text-center text-[14px]">
            Already have an account? <Link href="/login" className="text-primary font-bold no-underline hover:underline">Sign in</Link>
          </p>

          {success && (
            <div className="absolute inset-0 glass-card rounded-[35px] flex flex-col items-center justify-center z-20 animate-fadeIn">
              <div className="w-[60px] h-[60px] bg-primary-light rounded-full flex items-center justify-center mb-4">
                <span className="text-primary text-3xl">✓</span>
              </div>
              <h3 className="font-bold text-xl">Account Created!</h3>
              <p className="text-sm text-ink-muted mt-1.5">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialButton({ icon }: { icon: ReactNode }) {
  return (
    <button type="button" className="w-12 h-12 bg-white/40 dark:bg-white/5 border border-line dark:border-white/30 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-sm">
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-ink-main dark:fill-white">{icon}</svg>
    </button>
  );
}
