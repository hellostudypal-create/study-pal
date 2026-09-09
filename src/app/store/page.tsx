import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitledBankIds } from "@/lib/authz";
import { LogoMark } from "@/components/brand/Logo";
import { StoreGrid, type StoreItem } from "@/components/store/StoreGrid";
import { getT } from "@/lib/i18n/translate";

export default async function StorePage() {
  const session = await auth();
  const t = await getT();
  const [banks, ownedBankIds] = await Promise.all([
    db.bank.findMany({
      where: { isPersonal: false, isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { examQuestions: true, vocabWords: true } } },
    }),
    session?.user ? getEntitledBankIds(session.user.id) : Promise.resolve([]),
  ]);

  const items: StoreItem[] = banks.map((bank) => ({
    id: bank.id,
    title: bank.title,
    description: bank.description,
    kind: bank.kind,
    subtitle: bank.kind === "exam" ? bank.examCategory : bank.theme,
    itemCount: bank.kind === "exam" ? bank._count.examQuestions : bank._count.vocabWords,
    priceLabel: bank.price != null ? `Rs. ${Number(bank.price).toLocaleString()}` : null,
    owned: ownedBankIds.includes(bank.id),
    imageUrl: bank.coverImageUrl ?? `https://picsum.photos/seed/studypal-${bank.id}/480/360`,
  }));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand to-brand-2 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-light/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-gold/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-gold backdrop-blur">
            <LogoMark className="h-3.5 w-3.5" />
            {t("store.badge")}
          </span>
          <h1 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("store.heading")}
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/80 sm:text-base">{t("store.subheading")}</p>
        </div>
      </section>

      {items.length === 0 ? (
        <p className="text-muted-foreground">{t("store.emptyPublished")}</p>
      ) : (
        <StoreGrid items={items} />
      )}
    </div>
  );
}
