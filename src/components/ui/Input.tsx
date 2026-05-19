import React from 'react';
import s from './Input.module.scss';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', id, ...rest }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={s.wrap}>
      {label && <label className={s.label} htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={[s.input, error ? s.hasError : '', className].join(' ')} {...rest} />
      {error && <span className={s.error}>{error}</span>}
    </div>
  );
}
