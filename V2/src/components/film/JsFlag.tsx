"use client";

import { useEffect } from "react";

/**
 * Marks the site root once JavaScript runs, so scroll reveals only hide
 * content when there is code to show it again. Without JS, everything is
 * simply visible.
 */
export function JsFlag() {
  useEffect(() => {
    document.querySelector(".film")?.classList.add("is-js");
  }, []);
  return null;
}
