"use client";
import React from "react";
import { Stack } from "@fluentui/react";
import GenericChatbot from "@/components/Chatbot/";
import { initializeIcons } from "@fluentui/react/lib/Icons";

initializeIcons();

export default function Home() {
  return (
    <Stack
      verticalAlign="center"
      horizontalAlign="center"
      styles={{
        root: {
          minHeight: "100vh",
          padding: "20px",
          backgroundColor: "#f3f2f1",
          borderRadius: "8px",
        },
      }}
    >
      <GenericChatbot />
    </Stack>
  );
}
