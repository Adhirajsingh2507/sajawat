'use client';

/**
 * Profile & address (Account improvements). Self-service edit of name, phone,
 * and the saved delivery address via PATCH /auth/me. Server-authoritative: on
 * save we replace the auth-context user with the returned DTO. Login-gated (D17).
 */
import { useState } from 'react';
import Link from 'next/link';
import { Button, Container, Input, Label } from '@sajawat/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';
import { updateProfile, type ProfileInput } from '@/services/profile';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [line1, setLine1] = useState(user?.address?.line1 ?? '');
  const [line2, setLine2] = useState(user?.address?.line2 ?? '');
  const [city, setCity] = useState(user?.address?.city ?? '');
  const [stateName, setStateName] = useState(user?.address?.state ?? '');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode ?? '');
  const [country, setCountry] = useState(user?.address?.country ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const payload: ProfileInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      address: {
        line1: line1.trim(),
        line2: line2.trim(),
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      },
    };
    void updateProfile(payload)
      .then((next) => {
        updateUser(next);
        setSaved(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <Container className="py-12">
      <nav className="mb-2 text-xs text-ink-faint">
        <Link href="/account" className="hover:text-purple">
          My account
        </Link>{' '}
        / Profile
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink">Profile &amp; address</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Keep your details up to date for faster checkout.
      </p>

      <form onSubmit={submit} className="mt-8 max-w-2xl space-y-8">
        <section>
          <h2 className="font-serif text-lg text-ink">Your details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                autoComplete="given-name"
                onChange={(e) => {
                  setFirstName(e.target.value);
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                autoComplete="family-name"
                onChange={(e) => {
                  setLastName(e.target.value);
                }}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                autoComplete="tel"
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink">Delivery address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="line1">Address line 1</Label>
              <Input
                id="line1"
                value={line1}
                autoComplete="address-line1"
                onChange={(e) => {
                  setLine1(e.target.value);
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="line2">Address line 2 (optional)</Label>
              <Input
                id="line2"
                value={line2}
                autoComplete="address-line2"
                onChange={(e) => {
                  setLine2(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                autoComplete="address-level2"
                onChange={(e) => {
                  setCity(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={stateName}
                autoComplete="address-level1"
                onChange={(e) => {
                  setStateName(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal code</Label>
              <Input
                id="postalCode"
                value={postalCode}
                autoComplete="postal-code"
                onChange={(e) => {
                  setPostalCode(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                autoComplete="country-name"
                onChange={(e) => {
                  setCountry(e.target.value);
                }}
              />
            </div>
          </div>
        </section>

        {error !== null && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {saved && (
          <p aria-live="polite" className="text-sm text-green-700">
            Profile saved.
          </p>
        )}

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Container>
  );
}
