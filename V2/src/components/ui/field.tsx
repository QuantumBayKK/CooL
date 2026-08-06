import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/**
 * Form controls.
 *
 * The accessibility wiring is in the component rather than left to each call
 * site, because it is the part everyone forgets and nobody notices missing:
 * `aria-describedby` linking the input to its hint AND its error, `aria-invalid`
 * on the control itself, and an error that is announced rather than merely
 * coloured.
 *
 * Error styling never relies on colour alone — the border changes, the text
 * changes, and the message is real text. A red ring on its own is invisible to
 * a reader with a colour-vision deficiency and to anyone using forced-colors.
 */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>

      {describe(children, [hintId, errorId].filter(Boolean).join(" "))}

      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-fail">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Puts `aria-describedby` on the control itself.
 *
 * It has to land on the input — a wrapper element carrying the attribute does
 * nothing, because assistive technology reads the description from the focused
 * control, not from its parent. Cloning is the only way to do this without
 * making every call site repeat the ids by hand, which is exactly the step
 * people forget.
 *
 * A caller-supplied `aria-describedby` is preserved and appended to, so a field
 * that already points at extra help text does not lose it.
 */
function describe(children: ReactNode, ids: string): ReactNode {
  if (!ids) return children;

  const child = Children.only(children);
  if (!isValidElement(child)) return children;

  const typed = child as ReactElement<{ "aria-describedby"?: string }>;
  const existing = typed.props["aria-describedby"];

  return cloneElement(typed, {
    "aria-describedby": existing ? `${existing} ${ids}` : ids,
  });
}

const control = [
  "w-full bg-canvas text-ink",
  "border border-line-strong rounded-[--radius-sm]",
  "px-3 py-2 text-sm",
  "placeholder:text-ink-subtle",
  "transition-colors duration-[--duration-state] ease-[--ease-out]",
  "hover:border-ink-subtle",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-fail aria-[invalid=true]:bg-fail-wash",
].join(" ");

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-28 py-2.5", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-10", className)} {...props} />;
}
