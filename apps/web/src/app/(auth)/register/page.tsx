'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Heading, Input, Label } from '@sajawat/ui';
import { useAuth } from '@/features/auth/auth-context';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { status, register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      router.replace('/');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Unable to create your account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <span className="font-serif text-2xl font-semibold text-purple">Sajawat</span>
        <Heading level={2} className="mt-4 text-3xl">
          Create your account
        </Heading>
        <p className="mt-2 text-sm text-ink-soft">Register to browse the collection.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" required value={form.firstName} onChange={update('firstName')} />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" required value={form.lastName} onChange={update('lastName')} />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={update('password')}
          />
          <p className="mt-1 text-xs text-ink-faint">
            At least 8 characters, with a letter and a number.
          </p>
        </div>
        {error !== null && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-purple hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
