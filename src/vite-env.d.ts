/// <reference types="vite/client" />

declare module '@AP1-C01/parsed_questions.json' {
  import type { Question } from './types';
  const questions: Question[];
  export default questions;
}
