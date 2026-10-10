import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-xl border border-wall bg-cell px-3.5 py-2.5 text-[15px] text-fg placeholder:text-dim/60 transition focus-visible:outline-none focus:border-eosin focus:ring-2 focus:ring-eosin/25 aria-[invalid=true]:border-bad aria-[invalid=true]:ring-bad/20";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

/** Label + control + hint/error. The control gets its aria wiring from the parent via ids. */
export function Field({ id, label, hint, error, optional, className, children, aside }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {optional && <span className="ml-1.5 font-normal text-dim">optional</span>}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="text-[13px] text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-[13px] text-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectBox({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div className="relative">
      <select {...props} className={cn(inputClass, "appearance-none pr-10", !props.value && "text-dim/70")}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" aria-hidden="true" />
    </div>
  );
}
