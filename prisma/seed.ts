import { PrismaClient, type Role, type BankKind, type ExamCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const SEED_PASSWORD = "password123";

const USERS: { email: string; displayName: string; role: Role }[] = [
  { email: "admin@studypal.local", displayName: "Admin", role: "admin" },
  { email: "editor@studypal.local", displayName: "Content Editor", role: "content_editor" },
  { email: "alice@studypal.local", displayName: "Alice", role: "customer" },
  { email: "kasun@studypal.local", displayName: "Kasun", role: "customer" },
];

const VOCAB_BANKS: {
  title: string;
  description: string;
  theme: string;
  price: string;
  words: [term: string, definition: string, exampleSentence: string][];
}[] = [
  {
    title: "Essential Vocabulary Builder",
    description: "Everyday high-frequency words for general reading and writing.",
    theme: "General",
    price: "500",
    words: [
      ["candid", "truthful and straightforward; frank", "She gave a candid answer about the delay."],
      ["diligent", "showing careful and persistent effort", "He was diligent about finishing his homework early."],
      ["eloquent", "fluent and persuasive in speaking or writing", "Her eloquent speech moved the audience."],
      ["frugal", "sparing or economical with money or resources", "They lived a frugal life to save for the house."],
      ["gregarious", "fond of the company of others; sociable", "The gregarious host welcomed every guest warmly."],
      ["indifferent", "having no particular interest or sympathy", "He seemed indifferent to the outcome."],
      ["lucid", "expressed clearly; easy to understand", "The teacher gave a lucid explanation of the topic."],
      ["meticulous", "showing great attention to detail", "She was meticulous about checking her work."],
      ["obsolete", "no longer produced or used; out of date", "That software is now obsolete."],
      ["pragmatic", "dealing with things sensibly and realistically", "He took a pragmatic approach to the problem."],
    ],
  },
  {
    title: "Business English Vocabulary",
    description: "Everyday vocabulary for meetings, emails, and workplace communication.",
    theme: "Business English",
    price: "700",
    words: [
      ["synergy", "the combined effect greater than the sum of separate effects", "The merger created synergy between the teams."],
      ["stakeholder", "a person with an interest or concern in a business", "All stakeholders were invited to the review."],
      ["leverage", "to use something to maximum advantage", "The startup leveraged social media to grow."],
      ["benchmark", "a standard used to compare or measure something", "Our response time is the industry benchmark."],
      ["deliverable", "a thing that can be produced as a result of a project", "The first deliverable is due Friday."],
      ["procurement", "the action of obtaining goods or services", "Procurement negotiated a better supplier contract."],
      ["scalable", "able to be changed in size or scale", "They built a scalable platform to handle growth."],
      ["outsource", "to obtain services from an outside supplier", "The company outsourced its support overseas."],
      ["revenue", "income generated from normal business operations", "Quarterly revenue grew by fifteen percent."],
      ["negotiate", "to discuss something to reach an agreement", "Both sides negotiated for hours before signing."],
    ],
  },
];

const EXAM_BANKS: {
  title: string;
  description: string;
  examCategory: ExamCategory;
  price: string | null;
  questions: {
    questionText: string;
    answerText: string;
    category: string;
    explanationVideoUrl?: string;
    options?: string[]; // 4 options, first one is correct
  }[];
}[] = [
  {
    title: "O/L Mathematics",
    description: "Core O/L level mathematics questions covering algebra, geometry, and arithmetic.",
    examCategory: "OL",
    price: "800",
    questions: [
      { questionText: "Simplify: 3(x + 4) - 2x", answerText: "x + 12", category: "Algebra" },
      { questionText: "Find the value of x: 2x + 5 = 17", answerText: "6", category: "Algebra" },
      {
        questionText: "What is the area of a circle with radius 7cm? (use pi = 22/7)",
        answerText: "154 cm^2",
        category: "Geometry",
      },
      { questionText: "What is the sum of the interior angles of a triangle?", answerText: "180 degrees", category: "Geometry" },
      { questionText: "What is 15% of 200?", answerText: "30", category: "Arithmetic" },
      {
        questionText: "Which of the following is a prime number?",
        answerText: "17",
        category: "Number Theory",
        options: ["17", "15", "21", "27"],
      },
    ],
  },
  {
    title: "IQ Practice Set - Logic & Patterns",
    description: "Numerical and logical reasoning puzzles.",
    examCategory: "IQ",
    price: "650",
    questions: [
      { questionText: "What number comes next? 1, 4, 9, 16, 25, ...", answerText: "36", category: "Numerical Reasoning" },
      {
        questionText: "What is the missing number? 3, 6, 12, 24, ...",
        answerText: "48",
        category: "Numerical Reasoning",
        options: ["48", "36", "42", "54"],
      },
      { questionText: "A train travels 60km in 45 minutes. What is its speed in km/h?", answerText: "80 km/h", category: "Numerical Reasoning" },
      { questionText: "Half of a number is 45. What is the number?", answerText: "90", category: "Numerical Reasoning" },
      { questionText: "Complete the sequence: 2, 6, 18, 54, ...", answerText: "162", category: "Numerical Reasoning" },
    ],
  },
  {
    title: "Rich Solutions Demo - Worked Examples",
    description: "Demo bank showing Markdown-formatted answers and embedded explanation videos.",
    examCategory: "Other",
    price: null,
    questions: [
      {
        questionText: "A ball is thrown vertically upward with an initial velocity of 20 m/s. Calculate the maximum height it reaches (g = 10 m/s^2).",
        answerText: `## Solution

At maximum height, the final velocity **v = 0**.

Using the equation of motion:

> v^2 = u^2 - 2gh

Substituting values (u = 20 m/s, g = 10 m/s^2, v = 0):

0 = 20^2 - 2(10)h

h = 400 / 20 = **20 m**

So the ball reaches a maximum height of **20 meters**.`,
        category: "Mechanics",
        explanationVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        questionText: "Simplify: (2x + 3)(x - 4)",
        answerText: `Expand using the distributive property:

(2x + 3)(x - 4) = 2x·x + 2x·(-4) + 3·x + 3·(-4)

= 2x^2 - 8x + 3x - 12

= **2x^2 - 5x - 12**

![Worked steps](https://placehold.co/600x300/4f46e5/ffffff?text=Algebra+Worked+Steps)`,
        category: "Algebra",
      },
      {
        questionText: "Write the overall chemical equation for photosynthesis and explain each reactant's role.",
        answerText: `The overall equation for photosynthesis is:

**6CO2 + 6H2O + light energy -> C6H12O6 + 6O2**

| Reactant | Role |
| --- | --- |
| CO2 | Carbon source |
| H2O | Electron / hydrogen source |
| Light | Energy source |

This reaction occurs in the chloroplasts of plant cells.`,
        category: "Biology",
      },
    ],
  },
];

async function main() {
  const existingBanks = await db.bank.count();
  if (existingBanks > 0) {
    console.log("Database already has banks — skipping seed to avoid duplicates.");
    console.log("Run `npx prisma migrate reset` first if you want a clean reseed.");
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const users = new Map<string, string>(); // email -> id
  for (const u of USERS) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, passwordHash, displayName: u.displayName, role: u.role },
    });
    users.set(u.email, user.id);
    console.log(`User: ${u.email} (${u.role})`);
  }
  const adminId = users.get("admin@studypal.local")!;

  // Personal banks + entitlements for every seeded user, mirroring what
  // getOrCreatePersonalBank does on first real use.
  for (const [email, userId] of users) {
    for (const kind of ["vocab", "exam"] as BankKind[]) {
      const bank = await db.bank.create({
        data: {
          kind,
          title: `${email.split("@")[0]}'s ${kind === "vocab" ? "Vocabulary" : "Questions"}`,
          isPersonal: true,
          ownerUserId: userId,
        },
      });
      await db.entitlement.create({ data: { userId, bankId: bank.id, source: "personal" } });
    }
  }
  console.log("Created personal banks for each user.");

  const publicBankIds: string[] = [];

  for (const vb of VOCAB_BANKS) {
    const bank = await db.bank.create({
      data: {
        kind: "vocab",
        title: vb.title,
        description: vb.description,
        theme: vb.theme,
        price: vb.price,
        isPublished: true,
        ownerUserId: adminId,
        vocabWords: {
          create: vb.words.map(([term, definition, exampleSentence]) => ({ term, definition, exampleSentence })),
        },
      },
    });
    publicBankIds.push(bank.id);
    console.log(`Vocab bank: ${bank.title} (${vb.words.length} words)`);
  }

  for (const eb of EXAM_BANKS) {
    const bank = await db.bank.create({
      data: {
        kind: "exam",
        title: eb.title,
        description: eb.description,
        examCategory: eb.examCategory,
        price: eb.price,
        isPublished: true,
        ownerUserId: adminId,
      },
    });
    publicBankIds.push(bank.id);

    for (const q of eb.questions) {
      await db.examQuestion.create({
        data: {
          bankId: bank.id,
          questionText: q.questionText,
          answerText: q.answerText,
          category: q.category,
          language: "en",
          explanationVideoUrl: q.explanationVideoUrl,
          options: q.options
            ? {
                create: q.options.map((text, i) => ({
                  label: String.fromCharCode(65 + i),
                  text,
                  isCorrect: i === 0,
                  order: i,
                })),
              }
            : undefined,
        },
      });
    }
    console.log(`Exam bank: ${bank.title} (${eb.questions.length} questions)`);
  }

  // Give every seeded user access to all the public banks so quiz/browse
  // pages have something to show immediately.
  for (const userId of users.values()) {
    await db.entitlement.createMany({
      data: publicBankIds.map((bankId) => ({ userId, bankId, source: "manual_grant" as const })),
      skipDuplicates: true,
    });
  }

  console.log("\nSeed complete. All seeded users share the password:", SEED_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
