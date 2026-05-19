import React from 'react';
import s from './Button.module.scss';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={[s.btn, s[variant], s[size], fullWidth ? s.full : '', className].join(' ')}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className={s.spinner} />}
      {children}
    </button>
  );
}
