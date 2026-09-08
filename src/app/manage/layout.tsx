import { ManageSidebar } from "@/components/manage/ManageSidebar";

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-light-tint">
      <ManageSidebar />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
