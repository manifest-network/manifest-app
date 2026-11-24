import BigNumber from 'bignumber.js';
import React from 'react';

export interface AmountInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number | undefined;
  onValueChange: (newAmount: BigNumber | undefined) => void;
}

/**
 * A component for entering an amount of tokens. Allows only positive decimal
 * numbers, or empty values (for an empty field).
 * @param value The current value of the input field.
 * @param onValueChange A callback that is called when the value of the input field
 *                      changes, with the new amount.
 * @param className Additional classes to apply to the input field.
 * @param props Additional props to pass to the input field.
 * @constructor
 */
export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onValueChange,
  className,
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState<string>(
    value === undefined ? '' : value.toString()
  );

  const [lastValue, setLastValue] = React.useState<string | number | undefined>(value);

  React.useEffect(() => {
    if (value !== lastValue) {
      setInternalValue(value === undefined ? '' : value.toString());
      setLastValue(value);
    }
  }, [value, lastValue]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const v = event.target.value;

    // Allow for `.` to be entered on its way to a real number.
    if (v === '' || v === '.') {
      setInternalValue(v);
      onValueChange(undefined);
      return;
    }

    const newValue = /^\d*\.?\d*$/.test(v) ? new BigNumber(v) : null;

    if (newValue !== null) {
      setInternalValue(v);
      onValueChange(newValue);
    } else {
      onValueChange(internalValue === '' ? undefined : new BigNumber(internalValue));
    }
  }

  return (
    <input
      className={`input input-md border border-line bg-surface-field w-full pr-24 text-base-content ${className}`}
      type="text"
      placeholder="0.00"
      min={0}
      value={internalValue}
      onChange={onChange}
      onKeyDown={e => {
        if (e.key.length === 1 && !/[\d.]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
        }
      }}
      {...props}
    />
  );
};
