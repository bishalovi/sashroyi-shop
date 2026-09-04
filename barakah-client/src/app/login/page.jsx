"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

export default function LoginPage() {
  const { login } = useAuth();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const [serverMessage, setServerMessage] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setServerMessage("");
    setIsSubmittingForm(true);

    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Login successful!", {
          position: "top-right",
        });
        login(result.user);

        if (result.user.role === "barakahAdmin1234") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        toast.error(result.message || "Login failed!", {
          position: "top-right",
        });
        setServerMessage(result.message || "Login failed");
      }
    } catch (error) {
      toast.error("Something went wrong", {
        position: "top-right",
      });
      setServerMessage("Something went wrong");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf7f0] px-4 py-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-6 md:p-16">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Login to continue to Barakah
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email Address"
              className="input input-bordered w-full"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Enter a valid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full"
              {...register("password", {
                required: "Password is required",
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmittingForm}
            className="btn bg-[#d4af37] text-white w-full"
          >
            {isSubmittingForm ? "Logging in..." : "Login"}
          </button>
        </form>

        {serverMessage && (
          <p
            className={`text-sm text-center mt-4 ${
              serverMessage === "Login successful"
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {serverMessage}
          </p>
        )}

        <p className="text-sm text-center mt-5 text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#d4af37] font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
