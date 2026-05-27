"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fact-desk-admin-token";

export function useAdminToken() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(window.localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  function saveToken(nextToken: string) {
    setToken(nextToken);
    window.localStorage.setItem(STORAGE_KEY, nextToken);
  }

  return { token, setToken: saveToken };
}
