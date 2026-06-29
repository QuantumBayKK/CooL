import { StoryStage } from "@/features/StoryStage";

/**
 * The experience. One route; "pages" are chapters on a scroll timeline
 * (Technical Architecture §1). All nine chapters mount via the StoryStage.
 */
export default function Home() {
  return (
    <main id="main">
      <h1 className="sr-only">CooL — The Trust Layer for Artificial Intelligence</h1>
      <StoryStage />
    </main>
  );
}
