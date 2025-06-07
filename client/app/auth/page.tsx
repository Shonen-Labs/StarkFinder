"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleIcon, StarkFinderIcon } from "@/components/icons";
import Link from "next/link";

interface ValidationErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
}

interface ValidationState {
  name: boolean;
  username: boolean;
  email: boolean;
  password: boolean;
}
interface AuthPageProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function AuthPage({
  showBackButton = true,
  onBack,
}: AuthPageProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<ValidationState>({
    name: false,
    username: false,
    email: false,
    password: false,
  });
  const [isValid, setIsValid] = useState<ValidationState>({
    name: false,
    username: false,
    email: false,
    password: false,
  });

  // Email regex pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validation functions
  const validateName = (name: string): string | null => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name.trim()))
      return "Name can only contain letters and spaces";
    return null;
  };

  const validateUsername = (username: string): string | null => {
    if (!username.trim())
      return isLogin ? "Email or username is required" : "Username is required";

    if (isLogin) {
      // For login, accept either email or username
      if (emailRegex.test(username)) return null; // Valid email
      if (username.length >= 3) return null; // Valid username
      return "Enter a valid email or username (min 3 characters)";
    } else {
      // For register, validate as username
      if (username.length < 3) return "Username must be at least 3 characters";
      if (username.length > 20)
        return "Username must be less than 20 characters";
      if (!/^[a-zA-Z0-9_]+$/.test(username))
        return "Username can only contain letters, numbers, and underscores";
      return null;
    }
  };

  // Note: validateEmail is removed as it's not used in this component

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password))
      return "Password must contain at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/(?=.*\d)/.test(password))
      return "Password must contain at least one number";
    return null;
  };

  // Real-time validation
  useEffect(() => {
    const newErrors: ValidationErrors = {};
    const newIsValid: ValidationState = {
      name: false,
      username: false,
      email: false,
      password: false,
    };

    // Validate name (only for register)
    if (!isLogin) {
      const nameError = validateName(formData.name);
      if (nameError && touched.name) newErrors.name = nameError;
      newIsValid.name = !nameError;
    } else {
      newIsValid.name = true; // Not required for login
    }

    // Validate username
    const usernameError = validateUsername(formData.username);
    if (usernameError && touched.username) newErrors.username = usernameError;
    newIsValid.username = !usernameError;

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError && touched.password) newErrors.password = passwordError;
    newIsValid.password = !passwordError;

    setErrors(newErrors);
    setIsValid(newIsValid);
  }, [formData, touched, isLogin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputBlur = (field: keyof ValidationState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      username: true,
      email: true,
      password: true,
    });

    // Check if form is valid
    const nameValid = isLogin || !validateName(formData.name);
    const usernameValid = !validateUsername(formData.username);
    const passwordValid = !validatePassword(formData.password);

    if (!nameValid || !usernameValid || !passwordValid) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(isLogin ? "Login attempt:" : "Register attempt:", formData);
    setIsLoading(false);
  };

  const handleGoogleAuth = () => {
    console.log("Google authentication initiated");
    // Google OAuth integration would go here
  };
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    // Reset form state when switching modes
    setErrors({});
    setTouched({
      name: false,
      username: false,
      email: false,
      password: false,
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, x: isLogin ? -20 : 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      x: isLogin ? 20 : -20,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: {
      opacity: 1,
      y: 0,
      height: "auto",
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -10,
      height: 0,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-[url(&apos;data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fillRule="evenodd"%3E%3Cg fill="%23ffffff" fillOpacity="0.02"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&apos;)] opacity-50' />

      <motion.div
        className="relative w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Glow Effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-20"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <motion.div variants={itemVariants}>
          <Card className="relative bg-black/80 backdrop-blur-xl border-gray-800/50 shadow-2xl">
            {showBackButton && (
              <motion.div
                className="absolute top-6 left-6 z-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <motion.button
                  onClick={handleBack}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(31, 41, 55, 0.6)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}
            <CardHeader className="space-y-8 pb-8">
              {/* Logo/Brand */}
              <Link href="/">
                <motion.div
                  className="flex justify-center"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <StarkFinderIcon className="w-16 h-16" />
                </motion.div>
              </Link>

              {/* Tab Switcher */}
              <motion.div
                className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-800"
                variants={itemVariants}
              >
                <motion.button
                  onClick={handleModeSwitch}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 relative",
                    isLogin ? "text-black" : "text-gray-400 hover:text-white"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLogin && (
                    <motion.div
                      className="absolute inset-0 bg-white rounded-md shadow-sm"
                      layoutId="activeTab"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10">Sign In</span>
                </motion.button>
                <motion.button
                  onClick={handleModeSwitch}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 relative",
                    !isLogin ? "text-black" : "text-gray-400 hover:text-white"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {!isLogin && (
                    <motion.div
                      className="absolute inset-0 bg-white rounded-md shadow-sm"
                      layoutId="activeTab"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10">Sign Up</span>
                </motion.button>
              </motion.div>

              <motion.div className="text-center" variants={itemVariants}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? "login" : "register"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardTitle className="text-2xl font-bold text-white">
                      {isLogin ? "Welcome back" : "Create account"}
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-2">
                      {isLogin
                        ? "Sign in to your StarkFinder account"
                        : "Join StarkFinder and start exploring"}
                    </CardDescription>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Sign In */}
              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleGoogleAuth}
                    variant="outline"
                    className="w-full h-12 bg-white hover:bg-gray-100 text-black hover:text-black border-gray-300 font-medium"
                    disabled={isLoading}
                  >
                    <GoogleIcon className="w-5 h-5 mr-3" />
                    Continue with Google
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div className="relative" variants={itemVariants}>
                <Separator className="bg-gray-800" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-black px-4 text-sm text-gray-400">
                    or
                  </span>
                </div>
              </motion.div>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? "login-form" : "register-form"}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {!isLogin && (
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label
                        htmlFor="name"
                        className="text-gray-300 font-medium"
                      >
                        Full Name
                      </Label>
                      <motion.div
                        className="relative"
                        whileFocus={{ scale: 1.02 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <User
                          className={cn(
                            "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors",
                            errors.name
                              ? "text-red-400"
                              : isValid.name && touched.name
                              ? "text-green-400"
                              : "text-gray-400"
                          )}
                        />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          onBlur={() => handleInputBlur("name")}
                          className={cn(
                            "pl-11 pr-11 h-12 bg-gray-900/50 text-white placeholder:text-gray-500 transition-all duration-200",
                            errors.name
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                              : isValid.name && touched.name
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                              : "border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                          )}
                        />
                        {touched.name && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {errors.name ? (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            ) : isValid.name ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : null}
                          </div>
                        )}
                      </motion.div>
                      <AnimatePresence>
                        {errors.name && (
                          <motion.p
                            className="text-sm text-red-400 flex items-center gap-1"
                            variants={errorVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label
                      htmlFor="username"
                      className="text-gray-300 font-medium"
                    >
                      {isLogin ? "Email or Username" : "Username"}
                    </Label>
                    <motion.div
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <Mail
                        className={cn(
                          "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors",
                          errors.username
                            ? "text-red-400"
                            : isValid.username && touched.username
                            ? "text-green-400"
                            : "text-gray-400"
                        )}
                      />
                      <Input
                        id="username"
                        type="text"
                        placeholder={
                          isLogin
                            ? "Enter email or username"
                            : "Choose a username"
                        }
                        value={formData.username}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                        onBlur={() => handleInputBlur("username")}
                        className={cn(
                          "pl-11 pr-11 h-12 bg-gray-900/50 text-white placeholder:text-gray-500 transition-all duration-200",
                          errors.username
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : isValid.username && touched.username
                            ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                            : "border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                        )}
                      />
                      {touched.username && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {errors.username ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : isValid.username ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : null}
                        </div>
                      )}
                    </motion.div>
                    <AnimatePresence>
                      {errors.username && (
                        <motion.p
                          className="text-sm text-red-400 flex items-center gap-1"
                          variants={errorVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.username}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label
                      htmlFor="password"
                      className="text-gray-300 font-medium"
                    >
                      Password
                    </Label>
                    <motion.div
                      className="relative"
                      whileFocus={{ scale: 1.02 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <Lock
                        className={cn(
                          "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors",
                          errors.password
                            ? "text-red-400"
                            : isValid.password && touched.password
                            ? "text-green-400"
                            : "text-gray-400"
                        )}
                      />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        onBlur={() => handleInputBlur("password")}
                        className={cn(
                          "pl-11 pr-20 h-12 bg-gray-900/50 text-white placeholder:text-gray-500 transition-all duration-200",
                          errors.password
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : isValid.password && touched.password
                            ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                            : "border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        {touched.password && (
                          <div>
                            {errors.password ? (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            ) : isValid.password ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : null}
                          </div>
                        )}
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-white transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={showPassword ? "hide" : "show"}
                              initial={{ opacity: 0, rotate: -90 }}
                              animate={{ opacity: 1, rotate: 0 }}
                              exit={{ opacity: 0, rotate: 90 }}
                              transition={{ duration: 0.2 }}
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    </motion.div>
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          className="text-sm text-red-400 flex items-center gap-1"
                          variants={errorVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Password strength indicator for register */}
                    {!isLogin && formData.password && (
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-xs text-gray-400">
                          Password requirements:
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              formData.password.length >= 8
                                ? "text-green-400"
                                : "text-gray-500"
                            )}
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                formData.password.length >= 8
                                  ? "bg-green-400"
                                  : "bg-gray-600"
                              )}
                            />
                            8+ characters
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              /(?=.*[a-z])/.test(formData.password)
                                ? "text-green-400"
                                : "text-gray-500"
                            )}
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                /(?=.*[a-z])/.test(formData.password)
                                  ? "bg-green-400"
                                  : "bg-gray-600"
                              )}
                            />
                            Lowercase
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              /(?=.*[A-Z])/.test(formData.password)
                                ? "text-green-400"
                                : "text-gray-500"
                            )}
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                /(?=.*[A-Z])/.test(formData.password)
                                  ? "bg-green-400"
                                  : "bg-gray-600"
                              )}
                            />
                            Uppercase
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              /(?=.*\d)/.test(formData.password)
                                ? "text-green-400"
                                : "text-gray-500"
                            )}
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                /(?=.*\d)/.test(formData.password)
                                  ? "bg-green-400"
                                  : "bg-gray-600"
                              )}
                            />
                            Number
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {isLogin && (
                    <motion.div
                      className="flex items-center justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.label
                        className="flex items-center space-x-2 cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500/20"
                        />
                        <span className="text-sm text-gray-400">
                          Remember me
                        </span>
                      </motion.label>
                      <motion.button
                        type="button"
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Forgot password?
                      </motion.button>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={isLoading}
                      >
                        <AnimatePresence mode="wait">
                          {isLoading ? (
                            <motion.div
                              key="loading"
                              className="flex items-center space-x-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <motion.div
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "linear",
                                }}
                              />
                              <span>
                                {isLogin
                                  ? "Signing in..."
                                  : "Creating account..."}
                              </span>
                            </motion.div>
                          ) : (
                            <motion.span
                              key="text"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              {isLogin ? "Sign In" : "Create Account"}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.form>
              </AnimatePresence>

              {/* Footer */}
              <motion.div
                className="text-center pt-4"
                variants={itemVariants}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-gray-400">
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <motion.button
                    onClick={handleModeSwitch}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </motion.button>
                </p>
              </motion.div>

              {/* Terms */}
              {!isLogin && (
                <motion.p
                  className="text-xs text-gray-500 text-center leading-relaxed"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  By creating an account, you agree to our{" "}
                  <motion.a
                    href="#"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    Terms of Service
                  </motion.a>{" "}
                  and{" "}
                  <motion.a
                    href="#"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    Privacy Policy
                  </motion.a>
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
