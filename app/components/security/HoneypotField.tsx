'use client';

/**
 * Reusable honeypot input. Renders an off-screen field that real users will
 * never fill but most automated form-stuffers will. Server-side, the API
 * checks the same field name (see `lib/security/honeypot.ts`) and silently
 * discards the submission when it is non-empty.
 *
 * Usage:
 *   const [trap, setTrap] = useState('');
 *   ...
 *   <HoneypotField value={trap} onChange={setTrap} />
 *   ...
 *   body: JSON.stringify({ ..., [HONEYPOT_FIELD]: trap })
 *
 * Positioning rules:
 *   - aria-hidden + tabIndex=-1 so AT/keyboard users skip it.
 *   - autoComplete="off" to dissuade password managers.
 *   - Visually hidden via inline style (no Tailwind classes that could collide
 *     with theme overrides).
 */
import { HONEYPOT_FIELD } from '@/lib/security/honeypot';

type HoneypotFieldProps = {
  value: string;
  onChange: (next: string) => void;
};

export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label htmlFor={HONEYPOT_FIELD}>Website (do not fill)</label>
      <input
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
