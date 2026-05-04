import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function NickInput({ value, onChange, placeholder = "Twój nick na ten mecz", autoFocus }: Props) {
  return (
    <div className="space-y-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 24))}
        placeholder={placeholder}
        maxLength={24}
        autoFocus={autoFocus}
        className="h-11 rounded-full px-4"
      />
      <div className="text-[10px] font-mono text-ink-muted text-right pr-2">
        {value.trim().length}/24
      </div>
    </div>
  );
}