import { LogoBadge } from "@/components/brand/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoBadge className="mb-3 h-12 w-12 rounded-2xl" />
          <h1 className="text-2xl font-extrabold tracking-tight">Study Pal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Words and questions that actually stick.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
