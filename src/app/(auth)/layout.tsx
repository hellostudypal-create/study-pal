export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-2 text-xl font-extrabold text-primary-foreground shadow-lg shadow-primary/30">
            S
          </div>
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
