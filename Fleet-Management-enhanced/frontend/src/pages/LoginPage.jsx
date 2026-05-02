import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authService } from '../services/api';
import { socketService } from '../services/socket';
import { Card, Button, Input, Spinner } from '../components/UI';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthState } = useAuthStore();
  const [loginError, setLoginError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    setLoginError('');
    try {
      const response = await authService.login(email, password);
      const { user, token } = response.data;

      // Persist to localStorage and update store
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState(user, token);

      // Connect socket after auth
      socketService.connect(token);

      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed. Please try again.';
      setLoginError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            ⚔
          </div>
          <h1 className="text-4xl font-bold font-rajdhani text-amber-400">CONVOY</h1>
          <p className="text-slate-400 mt-1">Command &amp; Control System</p>
        </div>

        <Card>
          <h2 className="text-xl font-bold font-rajdhani text-slate-100 mb-6">Sign In</h2>

          {loginError && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
              error={errors.password?.message}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          Fleet Management System v2.0
        </p>
      </div>
    </div>
  );
};
