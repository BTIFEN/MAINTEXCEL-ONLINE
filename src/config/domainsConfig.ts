import { 
  TrendingUp, 
  Wrench, 
  Database, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Shield, 
  Award, 
  CheckSquare, 
  Users, 
  Lightbulb, 
  Cpu,
  Bell,
  Calendar,
  Clock,
  Hammer,
  Settings,
  Activity,
  LucideIcon,
  HelpCircle,
  FileText,
  AlertCircle,
  History,
  Target,
  ClipboardCheck,
  CheckCircle,
  UserCheck,
  List,
  BookOpen,
  Boxes,
  Map,
  UsersRound,
  GraduationCap,
  Briefcase,
  Layers,
  HardDrive,
  BrainCircuit,
  MessageSquare,
  BarChart3,
  HeartPulse,
  Flame,
  Binary
} from 'lucide-react';

export interface SubMenuConfig {
  name: string;
  subtitle: string;
  iconName: string;
  colorClass: string; // Tailwind color classes
}

export interface DomainConfig {
  id: string;
  name: string;
  subtitle: string;
  iconName: string;
  colorName: 'blue' | 'yellow' | 'teal' | 'red' | 'purple' | 'green' | 'orange' | 'slate' | 'pink' | 'deepPurple' | 'sky' | 'indigo';
  hexColor: string;
  submenus: SubMenuConfig[];
}

export const DOMAINS_CONFIG: DomainConfig[] = [
  {
    id: 'pilotage',
    name: 'Pilotage & Performance',
    subtitle: 'Suivi de la performance industrielle globale',
    iconName: 'TrendingUp',
    colorName: 'blue',
    hexColor: '#1C64F2',
    submenus: [
      { name: "KPI d'excellence", subtitle: "Suivi des indicateurs clés", iconName: "BarChart3", colorClass: "text-blue-600 bg-blue-50 border-blue-100" },
      { name: "Tableaux de bord TRS", subtitle: "Analyse du taux de rendement", iconName: "Activity", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      { name: "Suivi des objectifs", subtitle: "Alignement stratégique usine", iconName: "Target", colorClass: "text-purple-600 bg-purple-50 border-purple-100" },
      { name: "Analyse des pertes", subtitle: "Identification des goulots", iconName: "AlertCircle", colorClass: "text-rose-600 bg-rose-50 border-rose-100" }
    ]
  },
  {
    id: 'work-mgmt',
    name: 'Work Management',
    subtitle: 'Gestion du flux de travail quotidien',
    iconName: 'Wrench',
    colorName: 'yellow',
    hexColor: '#F59E0B',
    submenus: [
      { name: "Notifications & Gatekeeping", subtitle: "Identification et priorisation des travaux", iconName: "Bell", colorClass: "text-rose-500 bg-rose-50 border-rose-100" },
      { name: "Préparation", subtitle: "Préparation des travaux", iconName: "Calendar", colorClass: "text-blue-500 bg-blue-50 border-blue-100" },
      { name: "Planification & Ordonnancement", subtitle: "Planification de routine", iconName: "Clock", colorClass: "text-purple-500 bg-purple-50 border-purple-100" },
      { name: "Arrêts planifiés (Shutdowns)", subtitle: "Gestion des arrêts de ligne", iconName: "Layers", colorClass: "text-fuchsia-500 bg-fuchsia-50 border-fuchsia-100" },
      { name: "Exécution", subtitle: "Exécution des ordres de travail", iconName: "Wrench", colorClass: "text-emerald-500 bg-emerald-50 border-emerald-100" },
      { name: "Suivi & KPI", subtitle: "Suivi de la performance", iconName: "TrendingUp", colorClass: "text-orange-500 bg-orange-50 border-orange-100" },
      { name: "Maintenance opportuniste", subtitle: "Opportunités et travaux additionnels", iconName: "HelpCircle", colorClass: "text-slate-500 bg-slate-50 border-slate-100" }
    ]
  },
  {
    id: 'assets-ref',
    name: 'Assets & Référentiel',
    subtitle: 'Gouvernance des équipements et normes',
    iconName: 'Database',
    colorName: 'teal',
    hexColor: '#0D9488',
    submenus: [
      { name: "Hiérarchie des actifs", subtitle: "Structure arborescente ISO 14224", iconName: "Boxes", colorClass: "text-teal-600 bg-teal-50 border-teal-100" },
      { name: "Plans de maintenance", subtitle: "Gammes préventives constructeurs", iconName: "FileText", colorClass: "text-blue-600 bg-blue-50 border-blue-100" },
      { name: "Fiches techniques", subtitle: "Spécifications et tolérances", iconName: "BookOpen", colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100" },
      { name: "Standards de travail", subtitle: "Procédures opératoires standard", iconName: "ShieldCheck", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    ]
  },
  {
    id: 'fiabilite',
    name: 'Fiabilité',
    subtitle: 'Méthodes de fiabilisation et analyses de pannes',
    iconName: 'ShieldCheck',
    colorName: 'red',
    hexColor: '#DC2626',
    submenus: [
      { name: "RCA", subtitle: "Root Cause Analysis (5 Pourquoi, Ishikawa)", iconName: "Binary", colorClass: "text-rose-600 bg-rose-50 border-rose-100" },
      { name: "FMEA / MTA", subtitle: "Analyse des modes de défaillance (AMDEC)", iconName: "Cpu", colorClass: "text-purple-600 bg-purple-50 border-purple-100" },
      { name: "RCM", subtitle: "Reliability Centered Maintenance", iconName: "Database", colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100" },
      { name: "CBM", subtitle: "Condition Based Maintenance", iconName: "Activity", colorClass: "text-teal-600 bg-teal-50 border-teal-100" },
      { name: "Reliability Performance", subtitle: "Indicateurs de taux de pannes MTBF", iconName: "TrendingUp", colorClass: "text-amber-600 bg-amber-50 border-amber-100" }
    ]
  },
  {
    id: 'excellence-terrain',
    name: 'Excellence Terrain',
    subtitle: 'Amélioration continue au poste de travail',
    iconName: 'Sparkles',
    colorName: 'purple',
    hexColor: '#7C3AED',
    submenus: [
      { name: "5S", subtitle: "Organisation et propreté du poste", iconName: "Sparkles", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      { name: "Maintenance Autonome", subtitle: "Inspections périodiques opérateur", iconName: "Clock", colorClass: "text-amber-600 bg-amber-50 border-amber-100" },
      { name: "Lubrification", subtitle: "Rituels et plans de graissage", iconName: "Flame", colorClass: "text-red-600 bg-red-50 border-red-100" }
    ]
  },
  {
    id: 'logistique',
    name: 'Logistique & Ressources',
    subtitle: 'Ressources humaines et magasin pièces de rechange',
    iconName: 'Truck',
    colorName: 'green',
    hexColor: '#10B981',
    submenus: [
      { name: "Gestion de stock", subtitle: "Niveaux de stock et réapprovisionnement", iconName: "Boxes", colorClass: "text-green-600 bg-green-50 border-green-100" },
      { name: "Magasin PDR", subtitle: "Localisation et sorties pièces", iconName: "HardDrive", colorClass: "text-blue-600 bg-blue-50 border-blue-100" },
      { name: "Outillages spéciaux", subtitle: "Disponibilité et réservation", iconName: "Wrench", colorClass: "text-amber-600 bg-amber-50 border-amber-100" },
      { name: "Plan de charge équipes", subtitle: "Disponibilité des techniciens", iconName: "UsersRound", colorClass: "text-purple-600 bg-purple-50 border-purple-100" }
    ]
  },
  {
    id: 'hse',
    name: 'HSE & Sécurité',
    subtitle: 'Hygiène, Sécurité et Environnement',
    iconName: 'Shield',
    colorName: 'orange',
    hexColor: '#F97316',
    submenus: [
      { name: "Consignation LOTO", subtitle: "Lock-Out Tag-Out", iconName: "Shield", colorClass: "text-red-600 bg-red-50 border-red-100" },
      { name: "Permis de travail", subtitle: "Autorisations de travaux", iconName: "FileText", colorClass: "text-amber-600 bg-amber-50 border-amber-100" },
      { name: "Analyse de risques", subtitle: "Évaluation préalable HSE", iconName: "AlertCircle", colorClass: "text-orange-600 bg-orange-50 border-orange-100" },
      { name: "Audits HSE", subtitle: "Rapports de sécurité terrain", iconName: "ClipboardCheck", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100" }
    ]
  },
  {
    id: 'maturite',
    name: 'ARMP',
    subtitle: 'Maturité & Audits d\'Excellence',
    iconName: 'Award',
    colorName: 'slate',
    hexColor: '#475569',
    submenus: [
      { name: "Audits", subtitle: "Revues d'Excellence Maintenance", iconName: "ClipboardCheck", colorClass: "text-slate-600 bg-slate-50 border-slate-100" },
      { name: "Maturité", subtitle: "Évaluation globale des processus", iconName: "Target", colorClass: "text-blue-600 bg-blue-50 border-blue-100" },
      { name: "Roadmap", subtitle: "Feuille de route de progrès", iconName: "Map", colorClass: "text-amber-600 bg-amber-50 border-amber-100" },
      { name: "Historique", subtitle: "Revues passées et rapports d'audits", iconName: "History", colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100" }
    ]
  },
  {
    id: 'action-center',
    name: 'Action Center',
    subtitle: 'Plan d\'actions unifié',
    iconName: 'CheckSquare',
    colorName: 'pink',
    hexColor: '#D01C5F',
    submenus: [
      { name: "Toutes les actions", subtitle: "Registre central des actions", iconName: "List", colorClass: "text-pink-600 bg-pink-50 border-pink-100" },
      { name: "Mes actions", subtitle: "Actions affectées à mon profil", iconName: "UserCheck", colorClass: "text-blue-600 bg-blue-50 border-blue-100" },
      { name: "Actions en retard", subtitle: "Alertes sur échéances échues", iconName: "Clock", colorClass: "text-red-600 bg-red-50 border-red-100" },
      { name: "Actions critiques", subtitle: "Actions prioritaires urgentes", iconName: "AlertCircle", colorClass: "text-rose-600 bg-rose-50 border-rose-100" }
    ]
  },
  {
    id: 'organisation',
    name: 'Organisation & Compétences',
    subtitle: 'Gestion des compétences et formations',
    iconName: 'Users',
    colorName: 'deepPurple',
    hexColor: '#9333EA',
    submenus: [
      { name: "Matrice de compétences", subtitle: "Cartographie des savoir-faire", iconName: "UsersRound", colorClass: "text-purple-600 bg-purple-50 border-purple-100" },
      { name: "Habilitations", subtitle: "Habilitations électriques et spéciales", iconName: "ShieldCheck", colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100" },
      { name: "Formations maintenance", subtitle: "Plan annuel de formation", iconName: "GraduationCap", colorClass: "text-blue-600 bg-blue-50 border-blue-100" },
      { name: "Profils de postes", subtitle: "Fiches de fonction et exigences", iconName: "Briefcase", colorClass: "text-slate-600 bg-slate-50 border-slate-100" }
    ]
  },
  {
    id: 'knowledge',
    name: 'Knowledge Center',
    subtitle: 'Base de connaissances et capitalisation',
    iconName: 'Lightbulb',
    colorName: 'sky',
    hexColor: '#0284C7',
    submenus: [
      { name: "Leçons Ponctuelles OPL", subtitle: "One Point Lessons visuelles", iconName: "FileText", colorClass: "text-sky-600 bg-sky-50 border-sky-100" },
      { name: "Fiches RETEX", subtitle: "Retours d'expérience formalisés", iconName: "History", colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100" },
      { name: "Manuels constructeurs", subtitle: "Documentations machines", iconName: "BookOpen", colorClass: "text-slate-600 bg-slate-50 border-slate-100" },
      { name: "FAQ Technique", subtitle: "Questions fréquentes et réponses", iconName: "HelpCircle", colorClass: "text-amber-600 bg-amber-50 border-amber-100" }
    ]
  },
  {
    id: 'ai-maintex',
    name: 'MAINTeX AI',
    subtitle: 'Intelligence Artificielle générative intégrée',
    iconName: 'Cpu',
    colorName: 'indigo',
    hexColor: '#4F46E5',
    submenus: [
      { name: "Copilote technique", subtitle: "Assistant virtuel interactif", iconName: "BrainCircuit", colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100" },
      { name: "Génération de fiches", subtitle: "Création automatique de standards", iconName: "FileText", colorClass: "text-blue-600 bg-blue-50 border-blue-100" },
      { name: "Analyse prédictive de pannes", subtitle: "Détection précoce d'anomalies", iconName: "Activity", colorClass: "text-teal-600 bg-teal-50 border-teal-100" },
      { name: "Synthèse d'audits AI", subtitle: "Rapports consolidés par IA", iconName: "MessageSquare", colorClass: "text-purple-600 bg-purple-50 border-purple-100" }
    ]
  }
];

// Resolves a Lucide icon by string name
export const getIconByString = (name: string): LucideIcon => {
  const iconMap: { [key: string]: LucideIcon } = {
    TrendingUp,
    Wrench,
    Database,
    ShieldCheck,
    Sparkles,
    Truck,
    Shield,
    Award,
    CheckSquare,
    Users,
    Lightbulb,
    Cpu,
    Bell,
    Calendar,
    Clock,
    Hammer,
    Settings,
    Activity,
    HelpCircle,
    FileText,
    AlertCircle,
    History,
    Target,
    ClipboardCheck,
    CheckCircle,
    UserCheck,
    List,
    BookOpen,
    Boxes,
    Map,
    UsersRound,
    GraduationCap,
    Briefcase,
    Layers,
    HardDrive,
    BrainCircuit,
    MessageSquare,
    BarChart3,
    HeartPulse,
    Flame,
    Binary
  };
  return iconMap[name] || HelpCircle;
};

// Layout style configuration for domains
export interface ColorPalette {
  primary: string;
  bgLight: string;
  accent: string;
  border: string;
  textClass: string;
  dotColor: string;
}

export const COLOR_PALETTES: { [key: string]: ColorPalette } = {
  blue: { primary: '#1C64F2', bgLight: 'bg-blue-50/60', accent: '#1C64F2', border: 'border-blue-100', textClass: 'text-blue-600', dotColor: 'bg-blue-500' },
  yellow: { primary: '#F59E0B', bgLight: 'bg-amber-50/60', accent: '#F59E0B', border: 'border-amber-100', textClass: 'text-amber-600', dotColor: 'bg-amber-500' },
  teal: { primary: '#0D9488', bgLight: 'bg-teal-50/60', accent: '#0D9488', border: 'border-teal-100', textClass: 'text-teal-600', dotColor: 'bg-teal-500' },
  red: { primary: '#DC2626', bgLight: 'bg-red-50/60', accent: '#DC2626', border: 'border-red-100', textClass: 'text-red-600', dotColor: 'bg-red-500' },
  purple: { primary: '#7C3AED', bgLight: 'bg-purple-50/60', accent: '#7C3AED', border: 'border-purple-100', textClass: 'text-purple-600', dotColor: 'bg-purple-500' },
  green: { primary: '#10B981', bgLight: 'bg-emerald-50/60', accent: '#10B981', border: 'border-emerald-100', textClass: 'text-emerald-600', dotColor: 'bg-emerald-500' },
  orange: { primary: '#F97316', bgLight: 'bg-orange-50/60', accent: '#F97316', border: 'border-orange-100', textClass: 'text-orange-600', dotColor: 'bg-orange-500' },
  slate: { primary: '#475569', bgLight: 'bg-slate-50/60', accent: '#475569', border: 'border-slate-100', textClass: 'text-slate-600', dotColor: 'bg-slate-500' },
  pink: { primary: '#D01C5F', bgLight: 'bg-pink-50/60', accent: '#D01C5F', border: 'border-pink-100', textClass: 'text-pink-600', dotColor: 'bg-pink-500' },
  deepPurple: { primary: '#9333EA', bgLight: 'bg-fuchsia-50/60', accent: '#9333EA', border: 'border-fuchsia-100', textClass: 'text-fuchsia-600', dotColor: 'bg-fuchsia-500' },
  sky: { primary: '#0284C7', bgLight: 'bg-sky-50/60', accent: '#0284C7', border: 'border-sky-100', textClass: 'text-sky-600', dotColor: 'bg-sky-500' },
  indigo: { primary: '#4F46E5', bgLight: 'bg-indigo-50/60', accent: '#4F46E5', border: 'border-indigo-100', textClass: 'text-indigo-600', dotColor: 'bg-indigo-500' },
};
