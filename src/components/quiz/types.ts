export type QuizAnswerResult =
  | { kind: "verified_choice"; selectedAnswer: string }
  | { kind: "self_assessed"; wasCorrect: boolean };
