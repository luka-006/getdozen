"use client";

type Option = {
  value: string;
  label: string;
  hint?: string;
};

type Props = {
  id?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  required?: boolean;
  label: string;
};

/** Native select on desktop. Full-width taps on a phone. */
export function ChoiceTiles({
  id,
  name,
  value,
  onChange,
  options,
  required = false,
  label,
}: Props) {
  return (
    <div className="choice-field">
      <select
        id={id}
        name={name}
        className="select choice-native"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.hint ? `${option.label} · ${option.hint}` : option.label}
          </option>
        ))}
      </select>
      <div className="choice-tiles" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? "choice-tile choice-tile-on" : "choice-tile"}
              onClick={() => onChange(option.value)}
            >
              <span>{option.label}</span>
              {option.hint ? (
                <span className="choice-tile-hint">{option.hint}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
