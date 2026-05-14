"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginBodySchema, type LoginBody } from "@fixitnow/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/apiClient";

const DEFAULT_REDIRECT = "/";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginBody>({
    resolver: zodResolver(loginBodySchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);
    try {
      await login(data);
      const next = params.get("next") || DEFAULT_REDIRECT;
      router.push(next);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Login failed";
      setFormError(message);
    }
  });

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Log in to manage your bookings.
        </p>
      </header>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-destructive text-sm">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
          >
            {formError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-medium underline">
          Sign up
        </Link>
      </p>
    </section>
  );
}
