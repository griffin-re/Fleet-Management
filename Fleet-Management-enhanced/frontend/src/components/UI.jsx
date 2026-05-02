import React from 'react';
import clsx from 'clsx';

export const Button = React.forwardRef(
  ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    ...props
  }, ref) => {
    const baseStyles = 'font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold',
      secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      ghost: 'text-slate-300 hover:text-slate-100 hover:bg-slate-700',
      outline: 'border border-slate-600 hover:border-amber-500 text-slate-300 hover:text-amber-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2.5 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export const Card = ({ children, className, ...props }) => (
  <div
    className={clsx(
      'bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const Badge = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-slate-700 text-slate-100',
    active: 'bg-green-500/20 text-green-400 border border-green-600',
    idle: 'bg-gray-500/20 text-gray-400 border border-gray-600',
    maintenance: 'bg-amber-500/20 text-amber-400 border border-amber-600',
    deployed: 'bg-blue-500/20 text-blue-400 border border-blue-600',
    critical: 'bg-red-500/20 text-red-400 border border-red-600',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const Input = React.forwardRef(
  ({ className, error, label, ...props }, ref) => (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={clsx('input', error && 'border-red-500', className)}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';

export const Select = React.forwardRef(
  ({ className, error, label, children, ...props }, ref) => (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          'input appearance-none pl-3 pr-10 cursor-pointer',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
);

Select.displayName = 'Select';

export const Textarea = React.forwardRef(
  ({ className, error, label, ...props }, ref) => (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'input resize-none',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
);

Textarea.displayName = 'Textarea';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={clsx('modal', sizes[size])}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
          <h2 className="text-xl font-bold font-rajdhani text-amber-400">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl leading-none"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={clsx(
        'border-2 border-slate-700 border-t-amber-500 rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  );
};

export const Skeleton = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={clsx('skeleton', className)} />
      ))}
    </>
  );
};

export const Alert = ({ type = 'info', title, message, onClose, className }) => {
  const typeStyles = {
    success: 'bg-green-900/30 border-green-600 text-green-300',
    error: 'bg-red-900/30 border-red-600 text-red-300',
    warning: 'bg-amber-900/30 border-amber-600 text-amber-300',
    info: 'bg-blue-900/30 border-blue-600 text-blue-300',
  };

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border',
        typeStyles[type],
        className
      )}
    >
      {title && <h3 className="font-semibold mb-1">{title}</h3>}
      <p className="text-sm">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="mt-2 text-sm font-medium hover:underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

export const Toast = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: 'bg-green-900/30 border-green-700 text-green-300',
    error: 'bg-red-900/30 border-red-700 text-red-300',
    warning: 'bg-amber-900/30 border-amber-700 text-amber-300',
    info: 'bg-blue-900/30 border-blue-700 text-blue-300',
  };

  return (
    <div className={clsx('toast border', typeStyles[type])}>
      <div className="flex items-center justify-between">
        <p>{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-lg leading-none hover:opacity-70"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <Spinner size="lg" className="mb-4" />
    <p className="text-slate-400">Loading...</p>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12">
    {Icon && <Icon className="w-12 h-12 text-slate-500 mb-4" />}
    <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
    <p className="text-slate-400 text-center mb-4 max-w-sm">{description}</p>
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="text-6xl mb-4">⚠️</div>
    <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
    <p className="text-slate-400 text-center mb-6 max-w-sm">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="primary">
        Try Again
      </Button>
    )}
  </div>
);

export const Pagination = ({ page, totalPages, onChangePage }) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChangePage(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Previous
      </Button>
      <span className="text-slate-400">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChangePage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  );
};
