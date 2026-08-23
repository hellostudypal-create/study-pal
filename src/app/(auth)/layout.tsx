export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Study Pal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Words and questions that actually stick.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
