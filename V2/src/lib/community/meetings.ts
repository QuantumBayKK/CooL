import { useCallback, useEffect, useState } from "react";

import { communityBrowser } from "./browser";

/** A live community meeting: a Google Meet a member shared with everyone. */
export type Meeting = { id: string; title: string; link: string; host_name: string; host_handle: string | null; started_at: string; mine: boolean };

const MEET = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/; // the only links shown, whatever the server sends

/** The Meet code in a pasted link or bare code, or null. */
export function meetCode(input: string): string | null {
  return /(?:^|meet\.google\.com\/)([a-z]{3}-[a-z]{4}-[a-z]{3})(?![a-z-])/.exec(input.trim().toLowerCase())?.[1] ?? null;
}

/** Live meetings for signed-in members, refreshed every 10 seconds and whenever the tab comes back. */
export function useMeetings(enabled = true) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const refresh = useCallback(async () => {
    const { data } = (await communityBrowser()?.rpc("list_meetings")) ?? { data: null };
    setMeetings(((data as Meeting[] | null) ?? []).filter((m) => MEET.test(m.link)));
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const first = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), 10_000);
    const show = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", show);
    window.addEventListener("cm-meetings", show); // another part of the page changed them
    return () => { clearTimeout(first); clearInterval(timer); document.removeEventListener("visibilitychange", show); window.removeEventListener("cm-meetings", show); };
  }, [enabled, refresh]);
  return { meetings, refresh };
}

const changed = () => window.dispatchEvent(new Event("cm-meetings"));

/** Shares a meeting with the whole community; returns an error to show, or "". */
export async function startMeeting(title: string, link: string): Promise<string> {
  if (!meetCode(link)) return "That isn't a Google Meet link.";
  const s = communityBrowser();
  if (!s) return "Meetings are not available right now.";
  const { error } = await s.rpc("start_meeting", { p_title: title.trim(), p_link: link });
  if (error) return error.code === "P0001" ? "You've started a lot of meetings; try again in a while." : error.code === "22023" ? `${error.message[0]!.toUpperCase()}${error.message.slice(1)}.` : "Could not share the meeting. Please try again.";
  changed();
  return "";
}

export async function endMeeting(): Promise<void> {
  await communityBrowser()?.rpc("end_meeting");
  changed();
}
