import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/**
 * Minimal `asChild` slot.
 *
 * This replaces `@radix-ui/react-slot`, which fails to evaluate inside a React
 * Server Component under React 19.2 — it reaches for `createContext` at module
 * scope, and the server build has no client React to give it. The symptom is an
 * opaque `e.createContext is not a function` at page-collection time, pointing
 * at whichever file happened to import a Button first.
 *
 * We only ever use `asChild` for one thing: putting button styling on a
 * `next/link`. That needs className merging and prop forwarding, and nothing
 * else Radix's Slot provides. A dozen lines with no dependency is the better
 * trade on a site whose argument is that it keeps its supply chain small.
 *
 * Merge order is deliberate: the slot's className comes first so the child's
 * className wins on conflict via `tailwind-merge`. That lets a caller override
 * a variant style at the call site, which is what people expect from `asChild`.
 */
export function Slot({
  children,
  className,
  ...props
}: {
  // Optional in the type, required at runtime. `Button` spreads
  // `ComponentProps<"button">` through here, where `children` is optional, and
  // a required prop makes that spread unassignable.
  children?: ReactNode;
  className?: string;
} & Record<string, unknown>) {
  const child = Children.only(children);

  if (!isValidElement(child)) {
    throw new Error("Slot expects a single React element child.");
  }

  const typed = child as ReactElement<{ className?: string }>;

  return cloneElement(typed, {
    ...props,
    className: cn(className, typed.props.className),
  });
}
