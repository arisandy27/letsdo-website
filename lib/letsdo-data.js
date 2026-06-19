import {
  ShieldCheck,
  ClipboardList,
  Flame,
  FileCheck2,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Solutions", href: "/solutions" },
  { label: "Services", href: "/services" },
  { label: "Lab", href: "/#lab" },
  { label: "Contact", href: "/contact" },
];

export const SOLUTIONS = [
  {
    name: "MSDS Toolkit Pro",
    status: "Demo Ready",
    desc: "Manage material register, SDS documents, QR labels, compatibility checks, and storage risk visibility in one system.",
    icon: ShieldCheck,
    slug: "msds_toolkit_pro",
  },
  {
    name: "MOC Manager Pro",
    status: "Demo Ready",
    desc: "Digitize management of change workflow from screening to closure with better structure, tracking, and accountability.",
    icon: ClipboardList,
    slug: "moc_manager_pro",
  },
  {
    name: "Fire Maintenance Pro",
    status: "Available for Pilot",
    desc: "Track assets, scope mapping, schedules, inspections, findings, evidence, and reporting in a more connected workflow.",
    icon: Flame,
    slug: "fire_maintenance_pro",
  },
  {
    name: "E-Permit / Permit to Work",
    status: "In Development",
    desc: "Improve permit control, verification, and approval flow for higher-risk work activities.",
    icon: FileCheck2,
    slug: "e_permit",
  },
  {
    name: "OEE / Operations Performance Toolkit",
    status: "Available for Pilot",
    desc: "Monitor losses, downtime, availability, and improvement opportunities more clearly.",
    icon: BarChart3,
    slug: "oee_toolkit",
  },
  {
    name: "Inspection & Action Tracker",
    status: "Available for Pilot",
    desc: "Capture findings, assign actions, and monitor closure progress in one place.",
    icon: CheckCircle2,
    slug: "inspection_action_tracker",
  },
];

export const SERVICES = [
  "Workflow digitalization consulting",
  "Excel / Google Sheet to web app conversion",
  "SDS/MSDS system setup",
  "MOC and compliance workflow setup",
  "Fire maintenance tracking setup",
  "Custom operational dashboard development",
  "Pilot and MVP development",
];

export const BENEFITS = [
  "Built from real industrial experience",
  "Practical and field-oriented",
  "Suitable for growing companies",
  "Start from your current workflow",
  "Faster and lighter to implement",
  "Focused on action and follow-up",
];

export const PAIN_POINTS = [
  "SDS documents are scattered",
  "MOC records are difficult to track consistently",
  "Fire maintenance reports are prepared manually",
  "Findings and follow-up are disconnected",
  "Permit, inspection, and approval records live in separate files",
  "Operational visibility is limited",
];

export const LAB_ITEMS = [
  "CCTV Safety Observation Dashboard",
  "RT/RW Digital Administration",
  "Edu Exam Archive",
];
