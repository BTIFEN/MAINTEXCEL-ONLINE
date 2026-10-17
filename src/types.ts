/**
 * MAINTeX — Maintenance Excellence Platform
 * Types definition
 */

export type RoleType = 'admin' | 'performance_mgr' | 'technician' | 'auditor';

export interface UserProfile {
  id: string;
  name: string;
  role: RoleType;
  title: string;
  department: string;
  avatarUrl?: string;
  permissions: string[];
  unreadAlertsCount: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  source: 'RCA' | '5S' | 'Maintenance Autonome' | 'Audit' | 'ALPHAP' | 'Manuel';
  assignedTo: string;
  status: 'À faire' | 'En cours' | 'Bloqué' | 'Terminé';
  priority: 'Basse' | 'Moyenne' | 'Haute' | 'Critique';
  dueDate: string;
  createdAt: string;
}

export interface RcaSession {
  id: string;
  anomalyTitle: string;
  equipment: string;
  date: string;
  author: string;
  whys: string[];
  fishbone: {
    manpower: string[];
    machines: string[];
    materials: string[];
    methods: string[];
    environment: string[];
    measurement: string[];
  };
  status: 'Brouillon' | 'Validé' | 'Action_Créée';
}

export interface FiveSAudit {
  id: string;
  date: string;
  auditor: string;
  area: string;
  scores: {
    seiri: number;      // Trier
    seiton: number;     // Ranger
    seiso: number;      // Nettoyer
    seiketsu: number;   // Standardiser
    shitsuke: number;   // Suivre / Rigueur
  };
  notes: string;
}

export interface AutonomousCheckItem {
  id: string;
  equipment: string;
  taskName: string;
  frequency: 'Journalier' | 'Hebdomadaire' | 'Mensuel';
  lastDoneDate: string;
  status: 'Nominal' | 'Attention' | 'Critique';
  instructions: string;
  assignedRole: string;
  logs: {
    date: string;
    operator: string;
    status: 'Réussi' | 'Alerte';
    comment?: string;
  }[];
}

export interface KpiMetric {
  name: string;
  code: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'Nominal' | 'Warning' | 'Alert';
  trend: 'up' | 'down' | 'stable';
  history: { date: string; value: number }[];
}
