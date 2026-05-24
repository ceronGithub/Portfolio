"use client";
import { useEffect } from "react";

export function useTrackVisit() {
  useEffect(() => {
    fetch("/api/site-visit", { method: "POST" }).catch(() => {});
  }, []);
}