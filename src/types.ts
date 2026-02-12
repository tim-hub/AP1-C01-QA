export interface QuestionChoice {
  text: string;
  explanation: string;
  is_correct: boolean;
}

export interface QuestionRequirements {
  latency: string | null;
  throughput: string | null;
  cost_focus: boolean;
  security_focus: boolean;
  scalability: boolean;
  real_time: boolean;
  batch: boolean;
  pii_handling: boolean;
  multi_language: boolean;
}

export interface Question {
  question_number: number;
  domain: string | null;
  user_status: string;
  question: string;
  choices: QuestionChoice[];
  correct_index: number;
  services_mentioned: string[];
  requirements: QuestionRequirements;
}
