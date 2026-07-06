'use client';

/**
 * Contact form (Contact page). Submits a message that the API persists as a
 * b2c/contact CRM lead. Follows the form-UX rules: visible labels, semantic
 * input types, validation on blur (not keystroke), errors near the field with
 * role="alert", first-invalid-field focus on submit, and an aria-live success
 * state. Server is authoritative; we only surface its result.
 */
import { useRef, useState } from 'react';
import { Button, Input, Label } from '@sajawat/ui';
import type { ContactRequest } from '@sajawat/types';
import { ApiError } from '@/lib/api';
import { submitContact } from '@/services/contact';

type Field = 'name' | 'email' | 'phone' | 'message';
const EMPTY: Record<Field, string> = { name: '', email: '', phone: '', message: '' };

function validate(values: Record<Field, string>): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (values.name.trim().length === 0) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Please enter a valid email address.';
  if (values.phone.trim().length < 5) errors.phone = 'Please enter a phone number.';
  if (values.message.trim().length === 0) errors.message = 'Please write a message.';
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function set(field: Field, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as the user corrects it, but don't add new ones on keystroke.
    if (touched[field] === true) setErrors(validate({ ...values, [field]: value }));
  }

  function blur(field: Field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(values));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched({ name: true, email: true, phone: true, message: true });
    const firstInvalid = (['name', 'email', 'phone', 'message'] as const).find(
      (f) => found[f] !== undefined,
    );
    if (firstInvalid !== undefined) {
      formRef.current?.querySelector<HTMLElement>(`#contact-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    setServerError(null);
    const payload: ContactRequest = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      message: values.message.trim(),
    };
    void submitContact(payload)
      .then(() => {
        setDone(true);
      })
      .catch((err: unknown) => {
        setServerError(
          err instanceof ApiError ? err.message : 'Could not send your message. Please try again.',
        );
        setSubmitting(false);
      });
  }

  if (done) {
    return (
      <div
        aria-live="polite"
        className="animate-fade-in rounded-2xl border border-line bg-white p-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple/10 text-purple">
          <svg
            width={26}
            height={26}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-4 font-serif text-xl text-ink">Message sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          Thank you for reaching out — our team will reply within one business day.
        </p>
      </div>
    );
  }

  function fieldError(field: Field) {
    return touched[field] === true ? errors[field] : undefined;
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-line bg-white p-6 sm:p-8"
    >
      <h2 className="font-serif text-xl text-ink">Send a message</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Questions about a piece, an order, or bespoke work? We&apos;re here to help.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="contact-name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-name"
            value={values.name}
            autoComplete="name"
            onChange={(e) => {
              set('name', e.target.value);
            }}
            onBlur={() => {
              blur('name');
            }}
            aria-invalid={fieldError('name') !== undefined}
            aria-describedby={fieldError('name') !== undefined ? 'contact-name-err' : undefined}
          />
          {fieldError('name') !== undefined && (
            <p id="contact-name-err" role="alert" className="mt-1 text-xs text-red-600">
              {fieldError('name')}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={values.email}
              autoComplete="email"
              onChange={(e) => {
                set('email', e.target.value);
              }}
              onBlur={() => {
                blur('email');
              }}
              aria-invalid={fieldError('email') !== undefined}
              aria-describedby={fieldError('email') !== undefined ? 'contact-email-err' : undefined}
            />
            {fieldError('email') !== undefined && (
              <p id="contact-email-err" role="alert" className="mt-1 text-xs text-red-600">
                {fieldError('email')}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="contact-phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              value={values.phone}
              autoComplete="tel"
              onChange={(e) => {
                set('phone', e.target.value);
              }}
              onBlur={() => {
                blur('phone');
              }}
              aria-invalid={fieldError('phone') !== undefined}
              aria-describedby={fieldError('phone') !== undefined ? 'contact-phone-err' : undefined}
            />
            {fieldError('phone') !== undefined && (
              <p id="contact-phone-err" role="alert" className="mt-1 text-xs text-red-600">
                {fieldError('phone')}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="contact-message">
            Message <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="contact-message"
            value={values.message}
            rows={5}
            maxLength={2000}
            onChange={(e) => {
              set('message', e.target.value);
            }}
            onBlur={() => {
              blur('message');
            }}
            aria-invalid={fieldError('message') !== undefined}
            aria-describedby={
              fieldError('message') !== undefined ? 'contact-message-err' : undefined
            }
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
          />
          {fieldError('message') !== undefined && (
            <p id="contact-message-err" role="alert" className="mt-1 text-xs text-red-600">
              {fieldError('message')}
            </p>
          )}
        </div>

        {serverError !== null && (
          <p role="alert" className="text-sm text-red-600">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  );
}
