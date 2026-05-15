"use client";

import { useEffect, useState } from "react";

export const useTypingEffect = (text: string) => {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!text) {
      const resetTimer = window.setTimeout(() => {
        setOut("");
      }, 0);

      return () => {
        window.clearTimeout(resetTimer);
      };
    }

    const startTimer = window.setTimeout(() => {
      setOut("");
    }, 0);

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setOut(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 15);

    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(timer);
    };
  }, [text]);

  return out;
};
