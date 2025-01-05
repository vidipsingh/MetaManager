import React from 'react';
import { cn } from '@/lib/utils'; // If you have a classnames utility

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', title, description, className }) => {
  let alertClass = '';

  switch (type) {
    case 'success':
      alertClass = 'bg-green-100 border-green-400 text-green-700';
      break;
    case 'error':
      alertClass = 'bg-red-100 border-red-400 text-red-700';
      break;
    case 'warning':
      alertClass = 'bg-yellow-100 border-yellow-400 text-yellow-700';
      break;
    case 'info':
    default:
      alertClass = 'bg-blue-100 border-blue-400 text-blue-700';
      break;
  }

  return (
    <div className={cn('border-l-4 p-4', alertClass, className)}>
      <div className="font-bold">{title}</div>
      <p>{description}</p>
    </div>
  );
};

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <p className="text-sm">{children}</p>;
};
