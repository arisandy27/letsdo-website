export const metadata = {
  title: "Admin Inquiries | Let's Do",
  description: "Internal inquiry review page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
