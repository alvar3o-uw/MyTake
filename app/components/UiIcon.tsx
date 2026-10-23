const paths = {
  books: "M3 4h5v16H3z M3 7h5 M3 17h5 M10 4h4v16h-4z M10 7h4 M10 17h4 M16 5l4-1 3 15-4 1z M17 8l4-1 M19 17l3-1",
  movie: "M4 3h16v18H4z M4 8h16 M4 16h16 M8 3v5 M16 3v5 M8 16v5 M16 16v5",
  tv: "M3 7h18v14H3z M8 3l4 4 4-4 M7 17h6",
  anime: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M10 8l6 4-6 4z",
  signOut: "M9 4H4v16h5 M9 12h12 M17 8l4 4-4 4",
  back: "M20 12H4 M10 6l-6 6 6 6",
  play: "M8 5l11 7-11 7z",
};

export default function UiIcon({ name, className }: { name: keyof typeof paths; className?: string }) {
  return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
