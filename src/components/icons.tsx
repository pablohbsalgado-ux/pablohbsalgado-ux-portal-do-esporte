type P = { className?: string };
const base = (className?: string) => ({
  className: className ?? "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
});

export const IconCart = ({ className }: P) => (
  <svg {...base(className)}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h2l2.4 11.2a1 1 0 001 .8h9.7a1 1 0 001-.8L21 8H6.2" /></svg>
);
export const IconClose = ({ className }: P) => (
  <svg {...base(className)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconTrash = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const IconPin = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const IconClock = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconMenu = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const IconChevron = ({ className }: P) => (
  <svg {...base(className)}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconTrophy = ({ className }: P) => (
  <svg {...base(className)}><path d="M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 21h8M9 17h6v4H9z" /></svg>
);
export const IconCheck = ({ className }: P) => (
  <svg {...base(className)}><path d="M5 12l5 5L20 7" /></svg>
);
export const IconUser = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>
);
