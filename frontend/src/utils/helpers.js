import React from 'react';
import clsx from 'clsx';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

export const notification = (type, message) => {
  const bgColor = {
    success: 'bg-green-900/30 border-green-700 text-green-300',
    error: 'bg-red-900/30 border-red-700 text-red-300',
    warning: 'bg-amber-900/30 border-amber-700 text-amber-300',
    info: 'bg-blue-900/30 border-blue-700 text-blue-300',
  }[type];

  const icon = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }[type];

  return { type, message, icon, bgColor };
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const statusColor = {
  active: 'bg-green-500/20 text-green-400 border-green-600',
  idle: 'bg-gray-500/20 text-gray-400 border-gray-600',
  maintenance: 'bg-amber-500/20 text-amber-400 border-amber-600',
  deployed: 'bg-blue-500/20 text-blue-400 border-blue-600',
  completed: 'bg-cyan-500/20 text-cyan-400 border-cyan-600',
  critical: 'bg-red-500/20 text-red-400 border-red-600',
  pending: 'bg-slate-500/20 text-slate-400 border-slate-600',
};

export const severityColor = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
};

export const getStatusBadgeStyles = (status) => {
  return statusColor[status] || statusColor.pending;
};

export const getSeverityStyles = (severity) => {
  return severityColor[severity] || severityColor.low;
};

export const cn = (...classes) => clsx(...classes);

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateForm = (formData, schema) => {
  const errors = {};
  Object.keys(schema).forEach((field) => {
    const validator = schema[field];
    const value = formData[field];
    const error = validator(value);
    if (error) {
      errors[field] = error;
    }
  });
  return errors;
};

export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const truncate = (str, length = 50) => {
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const randInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
