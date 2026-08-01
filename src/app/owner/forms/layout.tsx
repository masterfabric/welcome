import PageLayout from "@/components/layout/PageLayout";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="FORMS MANAGEMENT"
      subtitle="Create and Manage Your Forms"
    >
      {children}
    </PageLayout>
  );
}
