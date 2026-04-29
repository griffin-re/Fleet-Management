import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store';
import { authService } from '../services/api';
import { Button, Input, Alert, Spinner } from '../components/UI';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthState } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await authService.login(data.email, data.password);
      const { user, token } = response.data;

      setAuthState(user, token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-slate-950 to-red-500" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full filter blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500 rounded-full filter blur-3xl opacity-20" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center text-2xl">
              ⚔️
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold font-rajdhani text-amber-400 mb-2">
              CONVOY
            </h1>
            <p className="text-slate-400">Fleet & Convoy Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('email')}
              type="email"
              placeholder="Email address"
              error={errors.email?.message}
              icon={<Mail />}
            />

            <Input
              {...register('password')}
              type="password"
              placeholder="Password"
              error={errors.password?.message}
              icon={<Lock />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Sign In'}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2 font-mono">Demo Credentials:</p>
            <div className="space-y-1 text-xs font-mono text-slate-300">
              <p>👤 admin@convoy.local</p>
              <p>🔑 password123</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500">
            Secure military-grade operations center
          </p>
        </div>
      </div>
    </div>
  );
};
