import { LoadingPanel } from "@/components/ui/loader";

/**
 * The Suspense fallback for every public route.
 *
 * It shows only when a segment actually suspends — a docs page compiling its
 * MDX, a cold serverless start. The common case is a warm prefetched route
 * that never reaches this file at all, which is why the indicator is a line of
 * text rather than a skeleton of a page nobody is going to see.
 *
 * The header and footer stay painted around it: they live in the layout, and
 * the layout is not what suspended.
 */
export default function Loading() {
  return <LoadingPanel label="Loading" />;
}
