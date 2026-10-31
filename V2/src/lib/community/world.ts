/**
 * The headquarters: districts, their rooms and what you can do in each. One source of truth for the
 * world map, the community home page and the realtime service's room list.
 * Every interactable names the web page that does the same thing, so nothing is world-only.
 */
export type RoomType = "lobby" | "commons" | "project" | "meeting" | "assembly" | "showcase" | "quiet" | "event" | "help";

export type Interactable = { id: string; label: string; href: string };

export type Room = {
  id: string;
  name: string;
  type: RoomType;
  summary: string;
  capacity: number;
  /** Feature flag that opens this room's actions; null means always open. */
  flag: string | null;
  interactables: Interactable[];
};

export const ROOMS: Room[] = [
  {
    id: "hq.lobby", name: "Main lobby", type: "lobby", capacity: 50, flag: null,
    summary: "Where everyone arrives: announcements, people and your first steps.",
    interactables: [
      { id: "lobby.directory", label: "Notice board", href: "/community" },
      { id: "lobby.people", label: "Who's here", href: "/community/contributors" },
    ],
  },
  {
    id: "hq.help", name: "Help desk", type: "help", capacity: 25, flag: null,
    summary: "Guidelines, privacy, reporting a concern and getting started.",
    interactables: [
      { id: "help.guidelines", label: "Community guidelines", href: "/community/guidelines" },
      { id: "help.privacy", label: "Privacy notice", href: "/community/privacy" },
      { id: "help.profile", label: "Your profile and privacy", href: "/community/profile" },
    ],
  },
  {
    id: "hq.projects", name: "Project district", type: "project", capacity: 50, flag: null,
    summary: "Entrances to active projects. Open issues and pull requests from the workstations.",
    interactables: [
      { id: "projects.directory", label: "Project directory", href: "/community/projects" },
      { id: "projects.cool", label: "CooL SDK", href: "/community/projects/cool-sdk" },
    ],
  },
  {
    id: "hq.commons", name: "The Commons", type: "commons", capacity: 50, flag: null,
    summary: "Propose open-source projects, discuss them, vote, and recruit a team.",
    interactables: [
      { id: "commons.ideas", label: "Idea wall", href: "/community/proposals" },
      { id: "commons.hub", label: "Commons hub", href: "/community/commons" },
    ],
  },
  {
    id: "hq.meeting", name: "Meeting hall", type: "meeting", capacity: 25, flag: "calendar",
    summary: "Create or join a meeting with a real Google Meet link.",
    interactables: [{ id: "meeting.terminal", label: "Meeting terminal", href: "/community/calendar" }],
  },
  {
    id: "hq.assembly", name: "Assembly hall", type: "assembly", capacity: 50, flag: null,
    summary: "Community-wide discussions, votes and scheduled gatherings.",
    interactables: [{ id: "assembly.polls", label: "Open votes", href: "/community/commons#polls" }],
  },
  {
    id: "hq.showcase", name: "Showcase gallery", type: "showcase", capacity: 50, flag: null,
    summary: "Shipped projects, releases, demos and contributor stories.",
    interactables: [{ id: "showcase.wall", label: "Showcase", href: "/community/commons#showcase" }],
  },
  {
    id: "hq.quiet", name: "Quiet work area", type: "quiet", capacity: 25, flag: null,
    summary: "Individual workstations and low-noise focus.",
    interactables: [{ id: "quiet.desk", label: "Your desk and profile", href: "/community/profile#desk" }],
  },
  {
    id: "hq.events", name: "Event space", type: "event", capacity: 50, flag: "calendar",
    summary: "Workshops, hackathons and scheduled events.",
    interactables: [{ id: "events.calendar", label: "Community calendar", href: "/community/calendar" }],
  },
];

export function roomById(id: string) {
  return ROOMS.find((r) => r.id === id) ?? null;
}
