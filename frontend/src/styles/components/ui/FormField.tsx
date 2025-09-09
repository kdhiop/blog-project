import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  icon?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, icon, required, error, children }: FormFieldProps) {
  return (
    <div className="form-group">
      <label className="form-label">
        {icon && <span className="label-icon">{icon}</span>}
        {label}
        {required && <span className="required">*</span>}
      </label>
      {children}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}