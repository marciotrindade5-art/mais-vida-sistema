const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const icons = {
  inicio: (
    <svg {...base}><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></svg>
  ),
  agenda: (
    <svg {...base}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ),
  ocupacao: (
    <svg {...base}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
  ),
  financeiro: (
    <svg {...base}><rect x="2" y="6" width="20" height="13" rx="2" /><circle cx="12" cy="12.5" r="2.5" /><path d="M6 10v.01M18 15v.01" /></svg>
  ),
  pacientes: (
    <svg {...base}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.6 3 5.2" /></svg>
  ),
  profissionais: (
    <svg {...base}><path d="M19 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 5 19.5V21" /><circle cx="12" cy="7.5" r="3.5" /></svg>
  ),
  especialidades: (
    <svg {...base}><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" /></svg>
  ),
  salas: (
    <svg {...base}><path d="M3 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M15 9h4a2 2 0 0 1 2 2v10M3 21h18M10 12h.01" /></svg>
  ),
  usuarios: (
    <svg {...base}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
  ),
  livres: (
    <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  mapa: (
    <svg {...base}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
  ),
  planos: (
    <svg {...base}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>
  ),
  unidades: (
    <svg {...base}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
  ),
  sair: (
    <svg {...base}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" /></svg>
  ),
};
