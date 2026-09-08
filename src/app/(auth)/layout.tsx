import { LogoBadge } from "@/components/brand/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light-tint px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex gap-4 justify-center items-center text-center">
          <LogoBadge className="h-12 w-12 rounded-2xl" />
          <h1 className="text-2xl font-extrabold tracking-tight">Study Pal</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
