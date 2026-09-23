import { useState } from 'react';
import { parseCoordinate, toDD, toDMM } from '../../lib/coords';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  type: 'lat' | 'lng';
}

export default function CoordinateInput({ label, value, onChange, type }: Props) {
  const [mode, setMode] = useState<'DD' | 'DMM'>('DD');
  const [raw, setRaw] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  const display =
    raw !== null
      ? raw
      : mode === 'DD'
        ? toDD(value)
        : toDMM(value, type);

  function commit() {
    if (raw === null) return;
    const parsed = parseCoordinate(raw);
    if (parsed === null || Number.isNaN(parsed)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(parsed);
    setRaw(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <div className="flex text-[10px] rounded overflow-hidden border">
          {(['DD', 'DMM'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setRaw(null);
                setInvalid(false);
              }}
              className={`px-2 py-0.5 ${
                mode === m
                  ? 'bg-heritage-maroon text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <input
        value={display}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        placeholder={mode === 'DD' ? 'e.g. 27.6790' : "e.g. 27°40.74'N"}
        className={`w-full border rounded px-2 py-1 text-sm ${
          invalid ? 'border-red-500 bg-red-50' : ''
        }`}
      />
      <p className="text-[10px] text-gray-400 mt-0.5">
        {invalid
          ? '⚠️ Invalid format'
          : mode === 'DD'
            ? `DMM: ${toDMM(value, type)}`
            : `DD: ${toDD(value)}`}
      </p>
    </div>
  );
}