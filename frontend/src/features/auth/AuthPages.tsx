import { useState } from "react";
import { Button } from "../../components/Button";
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { api, json } from "../../services/api";
import { ErrorMessage, Loading } from "../../components/UI";
import { useSession } from "./Session";
import type { ReactNode } from "react";
const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
  confirmPassword: z.string(),
});
type Values = z.infer<typeof schema>;
export function AuthPage({ register = false }: { register?: boolean }) {
  const nav = useNavigate();
  const query = useQueryClient();
  const location = useLocation();
  const { user } = useSession();
  const [error, setError] = useState<unknown>();
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(
      schema.superRefine((v, c) => {
        if (register) {
          if (!v.firstName.trim())
            c.addIssue({
              code: "custom",
              path: ["firstName"],
              message: "First name is required.",
            });
          if (!v.lastName.trim())
            c.addIssue({
              code: "custom",
              path: ["lastName"],
              message: "Last name is required.",
            });
          if (v.password.length < 12 || v.password.length > 64)
            c.addIssue({
              code: "custom",
              path: ["password"],
              message: "Use 12–64 characters.",
            });
          if (v.password !== v.confirmPassword)
            c.addIssue({
              code: "custom",
              path: ["confirmPassword"],
              message: "Passwords must match.",
            });
        }
      }),
    ),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const destination = (location.state as { from?: string })?.from;
  if (user)
    return (
      <Navigate
        to={
          destination?.startsWith("/") && !destination.startsWith("//")
            ? destination
            : "/account"
        }
        replace
      />
    );
  return (
    <div className="auth-layout">
      <div className="auth-visual">
        <img src="/images/coffee-story.jpg" alt="Coffee ritual" />
        <div>
          <p className="eyebrow light">YOUR DAILY RITUAL</p>
          <h2>
            A good cup.
            <br />A fresh start.
          </h2>
        </div>
      </div>
      <div className="auth-form">
        <p className="eyebrow">WELCOME TO AURUM</p>
        <h1>{register ? "Make yourself at home." : "Welcome back."}</h1>
        <p>
          {register
            ? "Create an account to keep your orders in one place."
            : "Your next great cup is waiting."}
        </p>
        <form
          onSubmit={handleSubmit(async (v) => {
            setError(null);
            try {
              if (register) {
                await api("/auth/register", json("POST", v));
                nav("/login", { state: { registered: true } });
              } else {
                await api(
                  "/auth/login",
                  json("POST", { email: v.email, password: v.password }),
                );
                await query.invalidateQueries({ queryKey: ["session"] });
                const target = (location.state as { from?: string })?.from;
                nav(
                  target?.startsWith("/") && !target.startsWith("//")
                    ? target
                    : "/account",
                );
              }
            } catch (e) {
              setError(e);
            }
          })}
        >
          {(location.state as { registered?: boolean })?.registered && (
            <p className="notice">Account created. Sign in to continue.</p>
          )}
          {register && (
            <div className="form-grid">
              {(["firstName", "lastName"] as const).map((k) => (
                <label key={k}>
                  {k === "firstName" ? "First name" : "Last name"}
                  <input
                    {...field(k)}
                    autoComplete={
                      k === "firstName" ? "given-name" : "family-name"
                    }
                    maxLength={80}
                  />
                  <span className="field-error">{errors[k]?.message}</span>
                </label>
              ))}
            </div>
          )}
          <label>
            Email
            <input
              {...field("email")}
              type="email"
              autoComplete="email"
              maxLength={254}
            />
            <span className="field-error">{errors.email?.message}</span>
          </label>
          <label>
            Password
            <input
              {...field("password")}
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              maxLength={64}
            />
            <span className="field-error">{errors.password?.message}</span>
          </label>
          {register && (
            <label>
              Confirm password
              <input
                {...field("confirmPassword")}
                type="password"
                autoComplete="new-password"
              />
              <span className="field-error">
                {errors.confirmPassword?.message}
              </span>
            </label>
          )}
          <ErrorMessage error={error} />
          <Button type="submit" className="full" loading={isSubmitting}>
            {isSubmitting
              ? "Please wait…"
              : register
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>
        <p className="auth-switch">
          {register ? "Already part of the ritual?" : "New to AURUM?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
export function Protected({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { user, loading, error } = useSession();
  const location = useLocation();
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="container section">
        <ErrorMessage error={error} />
      </div>
    );
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== "ADMIN")
    return (
      <div className="container section">
        <h1>Access restricted.</h1>
        <p>This area is available to administrators.</p>
        <Link to="/shop">Return to shop</Link>
      </div>
    );
  return children;
}
