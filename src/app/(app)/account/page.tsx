import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountForm } from "@/components/account/AccountForm";
import { PasswordForm } from "@/components/account/PasswordForm";
import { LanguageToggle } from "@/components/nav/LanguageToggle";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { getT } from "@/lib/i18n/translate";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, displayName: true, phone: true, role: true, createdAt: true },
  });
  if (!user) redirect("/login");

  const t = await getT();
  const roleLabel =
    user.role === "admin"
      ? t("account.roleAdmin")
      : user.role === "content_editor"
        ? t("account.roleContentEditor")
        : t("account.roleCustomer");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("account.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm
            initial={{
              displayName: user.displayName ?? "",
              email: user.email,
              phone: user.phone ?? "",
            }}
            roleLabel={roleLabel}
            memberSince={user.createdAt.toLocaleDateString()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.language")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t("account.languageHint")}</p>
          <LanguageToggle className="h-9 w-9 border border-border" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t("account.appearanceHint")}</p>
          <ThemeToggle className="h-9 w-9 border border-border" />
        </CardContent>
      </Card>
    </div>
  );
}
