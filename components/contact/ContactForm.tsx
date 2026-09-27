"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Spinner from "@/components/ui/Spinner";
import { emailjs as emailjsConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Field = "name" | "email" | "message";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const EMPTY: Values = { name: "", email: "", message: "" };

/**
 * Validates on submit and derives every error from the current values.
 *
 * The previous form kept three `isValid` booleans that were only ever flipped to
 * `true` on blur and never back to `false`, so once a field had been valid the
 * form stayed submittable no matter what you typed afterwards.
 */
function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Please enter a valid email address.";
  if (!values.message.trim()) errors.message = "Please enter a message.";
  return errors;
}

export default function ContactForm() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear the field's error as soon as the visitor starts fixing it.
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError(null);

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      // Imported lazily so the EmailJS SDK is not in the initial bundle.
      const { send } = await import("@emailjs/browser");
      await send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          from_name: values.name,
          from_email: values.email,
          message: values.message,
        },
        { publicKey: emailjsConfig.publicKey },
      );
      setValues(EMPTY);
      router.push("/success");
    } catch {
      setSendError("Sending failed. Please email me directly instead.");
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm text-fg-muted">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={cn(fieldClass, errors.name ? "border-red-500" : "border-border")}
        />
        {errors.name && (
          <p id="name-error" className="mt-1.5 text-xs text-red-500">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-fg-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={cn(fieldClass, errors.email ? "border-red-500" : "border-border")}
        />
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm text-fg-muted">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={8}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={cn(fieldClass, "resize-y", errors.message ? "border-red-500" : "border-border")}
        />
        {errors.message && (
          <p id="message-error" className="mt-1.5 text-xs text-red-500">
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {submitting && <Spinner label="Sending" />}
        {submitting ? "Sending…" : "Send message"}
      </button>

      {sendError && (
        <p role="alert" className="text-sm text-red-500">
          {sendError}
        </p>
      )}
    </form>
  );
}
