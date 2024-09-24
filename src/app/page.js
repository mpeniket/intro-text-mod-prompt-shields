"use client";
import React from "react";
import GenericChatbot from "@/components/Chatbot/";
import { initializeIcons } from "@fluentui/react/lib/Icons";

// Initialize Fluent UI icons
initializeIcons();

export default function Home() {
  return (
      <GenericChatbot />
  );
}
