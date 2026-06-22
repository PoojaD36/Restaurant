'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useCustomerAuth } from '../contexts/customer-auth-context';
import { CustomerRegisterRequest, CustomerLoginRequest } from '../lib/customer-types';
import { Mail, Lock, User, Phone, X } from 'lucide-react';

interface CustomerAuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function CustomerAuthSheet({ isOpen, onClose, defaultMode = 'login' }: CustomerAuthSheetProps) {
  const { login, register, error, clearError } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState<CustomerLoginRequest>({
    identifier: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState<CustomerRegisterRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.identifier || !loginData.password) return;

    setIsLoading(true);
    clearError();

    try {
      await login(loginData);
      onClose();
    } catch (err) {
      // Error is handled by context
    } finally {
      setIsLoading(false);
    }
  };

  const validateRegister = (): boolean => {
    const errors: Record<string, string> = {};

    if (!registerData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!registerData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(registerData.phone)) {
      errors.phone = 'Phone must be 10-15 digits';
    }
    if (registerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!registerData.password || registerData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegister()) return;

    setIsLoading(true);
    clearError();

    try {
      await register(registerData);
      onClose();
    } catch (err) {
      // Error is handled by context
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
    setRegisterErrors({});
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t bg-gradient-to-b from-orange-50 to-white"
        style={{ height: 'auto', maxHeight: '90vh' }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-orange-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <SheetHeader className="text-center mb-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {mode === 'login' ? 'Welcome Back!' : 'Join Us Today!'}
          </SheetTitle>
          <SheetDescription className="text-base">
            {mode === 'login'
              ? 'Sign in to continue ordering your favorite food'
              : 'Create an account to start ordering'}
          </SheetDescription>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="login-identifier">Email or Phone</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    id="login-identifier"
                    type="text"
                    placeholder="Enter email or phone"
                    className="pl-10"
                    value={loginData.identifier}
                    onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter password"
                    className="pl-10"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Register
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-firstname">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                    <Input
                      id="register-firstname"
                      type="text"
                      placeholder="John"
                      className="pl-10"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                    />
                  </div>
                  {registerErrors.firstName && (
                    <p className="text-red-500 text-xs">{registerErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-lastname">Last Name</Label>
                  <Input
                    id="register-lastname"
                    type="text"
                    placeholder="Doe"
                    value={registerData.lastName || ''}
                    onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="1234567890"
                    className="pl-10"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  />
                </div>
                {registerErrors.phone && (
                  <p className="text-red-500 text-xs">{registerErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                    value={registerData.email || ''}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </div>
                {registerErrors.email && (
                  <p className="text-red-500 text-xs">{registerErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Min. 8 characters"
                    className="pl-10"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  />
                </div>
                {registerErrors.password && (
                  <p className="text-red-500 text-xs">{registerErrors.password}</p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-orange-200">
          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
