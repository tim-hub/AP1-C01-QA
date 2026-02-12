import Dexie, { type Table } from 'dexie';

export interface Answer {
  question_number: number;
  uuid: string;
  selected_choices: number[]; // Array of indices of selected choices
  timestamp: number;
}

export class QAAppDatabase extends Dexie {
  answers!: Table<Answer>;

  constructor() {
    super('QAAppDatabase');
    this.version(1).stores({
      answers: '[uuid+question_number], uuid, question_number, timestamp' // selected_choices is not indexed
    });
  }
}

export const db = new QAAppDatabase();
