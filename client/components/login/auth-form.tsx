"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AuthFormProps {
  isLogin: boolean;
  onToggleMode: () => void;
}

interface FormData {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface ValidationErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  general?: string;
}

export function AuthForm({ isLogin }: AuthFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = isLogin
        ? "Email or username is required"
        : "Username is required";
    }

    if (!isLogin && !formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        // Handle login with Auth.js v5 - using signIn from auth.ts
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });

        if (response.ok) {
          router.push("/devx");
          router.refresh();
        } else {
          setErrors({
            general:
              "Invalid credentials. Please check your username/email and password.",
          });
        }
      } else {
        // Handle registration
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ general: data.error || "Registration failed" });
        } else {
          // Auto-login after successful registration
          const loginResponse = await fetch("/api/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: formData.username,
              password: formData.password,
            }),
          });

          if (loginResponse.ok) {
            router.push("/devx");
            router.refresh();
          } else {
            setErrors({
              general:
                "Registration successful! Please try logging in with your credentials.",
            });
          }
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errors.general}
          </p>
        </motion.div>
      )}

      {!isLogin && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Label htmlFor="name" className="text-gray-300 font-medium">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={cn(
                "pl-11 h-12 bg-gray-900/50 text-white placeholder:text-gray-500",
                errors.name ? "border-red-500" : "border-gray-700"
              )}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username" className="text-gray-300 font-medium">
          {isLogin ? "Email or Username" : "Username"}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="username"
            type="text"
            placeholder={
              isLogin ? "Enter email or username" : "Choose a username"
            }
            value={formData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            className={cn(
              "pl-11 h-12 bg-gray-900/50 text-white placeholder:text-gray-500",
              errors.username ? "border-red-500" : "border-gray-700"
            )}
          />
        </div>
        {errors.username && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.username}
          </p>
        )}
      </div>

      {!isLogin && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Label htmlFor="email" className="text-gray-300 font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={cn(
                "pl-11 h-12 bg-gray-900/50 text-white placeholder:text-gray-500",
                errors.email ? "border-red-500" : "border-gray-700"
              )}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.email}
            </p>
          )}
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-300 font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className={cn(
              "pl-11 pr-11 h-12 bg-gray-900/50 text-white placeholder:text-gray-500",
              errors.password ? "border-red-500" : "border-gray-700"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
          </div>
        ) : (
          <span>{isLogin ? "Sign In" : "Create Account"}</span>
        )}
      </Button>
    </form>
  );
}
