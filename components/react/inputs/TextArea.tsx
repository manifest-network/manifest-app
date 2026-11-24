import { useField } from 'formik';
import React from 'react';

interface TextAreaProps {
  label: string;
  name: string;
  className?: string;
}

export const TextArea: React.FC<
  TextAreaProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  const id = props.id || props.name;
  return (
    <div className="form-control w-full">
      <label className="label" htmlFor={id}>
        <span className="label-text text-content-muted">{label}</span>
      </label>
      <div className="relative">
        <textarea
          id={id}
          {...field}
          {...props}
          className={`text-base-content textarea border-line bg-surface-field w-full 
            autofill:bg-surface-field
            focus:bg-surface-field
            ${props.className}`}
        />
      </div>
      {meta.touched && meta.error ? (
        <label className="label">
          <span className="label-text-alt text-error">{meta.error}</span>
        </label>
      ) : null}
    </div>
  );
};
