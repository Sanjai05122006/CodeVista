"use client";

import { useEffect, useState } from "react";

export const useTypingEffect = (text: string) => {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!text) {
      setOut("");
      return;
    }

    let index = 0;
    setOut("");

    const timer = window.setInterval(() => {
      index += 1;
      setOut(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 15);

    return () => {
      window.clearInterval(timer);
    };
  }, [text]);

  return out;
};
