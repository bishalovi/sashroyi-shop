"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

export default function RegisterPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const passwordValue = watch("password");

  const onSubmit = async (data) => {
    setServerMessage("");
    setIsSubmittingForm(true);

    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Registration successful!", {
          position: "top-right",
        });
        setServerMessage("Registration successful");
        reset();
      } else {
        toast.error(result.message || "Registration failed!", {
          position: "top-right",
        });
        setServerMessage(result.message || "Registration failed");
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
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Register to continue to Barakah
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User Name */}
          <div>
            <input
              type="text"
              placeholder="User Name"
              className="input input-bordered w-full"
              {...register("userName", {
                required: "User name is required",
                minLength: {
                  value: 3,
                  message: "User name must be at least 3 characters",
                },
              })}
            />
            {errors.userName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.userName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <input
              type="text"
              placeholder="Phone Number"
              className="input input-bordered w-full"
              {...register("phone", {
                required: "Phone number is required",
                minLength: {
                  value: 11,
                  message: "Phone number must be at least 11 digits",
                },
              })}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/,
                  message:
                    "Password must include at least one uppercase and one lowercase letter",
                },
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              className="input input-bordered w-full"
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === passwordValue || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmittingForm}
            className="btn bg-[#d4af37] text-white w-full"
          >
            {isSubmittingForm ? "Registering..." : "Register"}
          </button>
        </form>

        {serverMessage && (
          <p
            className={`text-sm text-center mt-4 ${
              serverMessage === "Registration successful"
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {serverMessage}
          </p>
        )}

        <p className="text-sm text-center mt-5 text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-[#d4af37] font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
