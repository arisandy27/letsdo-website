import type { Metadata } from "next";

const SOLUTION_META: Record<
  string,
  { title: string; description: string }
> = {
  msds_toolkit_pro: {
    title: "MSDS Toolkit Pro",
    description:
      "Practical SDS management with document control, QR access, compatibility checks, and storage visibility.",
  },
  moc_manager_pro: {
    title: "MOC Manager Pro",
    description:
      "A structured digital workflow for management of change from screening to closure.",
  },
  fire_maintenance_pro: {
    title: "Fire Maintenance Pro",
    description:
      "Track fire maintenance assets, inspections, findings, evidence, and reporting in one workflow.",
  },
  e_permit: {
    title: "E-Permit / Permit to Work",
    description:
      "A practical workflow concept for permit request, verification, and approval control.",
  },
  oee_toolkit: {
    title: "OEE / Operations Performance Toolkit",
    description:
      "Improve visibility of losses, downtime, and improvement opportunities with a practical operations toolkit.",
  },
  inspection_action_tracker: {
    title: "Inspection and Action Tracker",
    description:
      "Capture findings, assign actions, and monitor closure progress in one place.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = SOLUTION_META[slug];

  if (!item) {
    return {
      title: "Solution | Let's Do",
      description: "Practical digital solution detail page.",
    };
  }

  return {
    title: `${item.title} | Let's Do`,
    description: item.description,
  };
}

export default function SolutionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
