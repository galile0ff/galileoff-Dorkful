"use client";

// Bildirim (Toast) bileşeni
export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="toast">
      {message}
    </div>
  );
}
