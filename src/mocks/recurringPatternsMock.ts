import { RecurringTransaction } from '@/utils/types';

export const mockUnconfirmedPatterns: RecurringTransaction[] = [
  {
    id: 1,
    name: "Monthly Rent",
    amount: 1200,
    frequencyType: "monthly",
    frequencyEveryN: 1,
    startDate: "2023-01-01T00:00:00.000Z",
    status: "SCHEDULED",
    type: "expense"
  },
  {
    id: 2,
    name: "Gym Membership",
    amount: 50,
    frequencyType: "monthly",
    frequencyEveryN: 1,
    startDate: "2023-01-15T00:00:00.000Z",
    status: "SCHEDULED",
    type: "expense"
  }
];

export const mockLinkedTransactions = [
  {
    id: 101,
    description: "Rent Payment January",
    executionDate: "2023-01-01T00:00:00.000Z",
    amount: 1200,
    status: "SCHEDULED",
    type: "expense"
  },
  {
    id: 102,
    description: "Rent Payment February",
    executionDate: "2023-02-01T00:00:00.000Z",
    amount: 1200,
    status: "SCHEDULED",
    type: "expense"
  },
  {
    id: 103,
    description: "Rent Payment March",
    executionDate: "2023-03-01T00:00:00.000Z",
    amount: 1200,
    status: "SCHEDULED",
    type: "expense"
  }
]; 