/**
 * Card Component
 *
 * A glass-effect container used for grouping related content.
 * Uses the glassmorphism utility from globals.css.
 */

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl p-6 animate-fade-in ${className}`}
    >
      {children}
    </div>
  );
}
