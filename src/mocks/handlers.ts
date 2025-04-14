import { http, HttpResponse } from 'msw';
import { mockUnconfirmedPatterns, mockLinkedTransactions } from './recurringPatternsMock';

export const handlers = [
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/unconfirmed-patterns`, () => {
    return HttpResponse.json(mockUnconfirmedPatterns);
  }),
  
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/:patternId/linked-transactions`, () => {
    return HttpResponse.json(mockLinkedTransactions);
  }),
  
  http.post(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/:patternId/confirm-pattern`, () => {
    return HttpResponse.json({ success: true });
  }),
  
  http.post(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/:patternId/remove-transaction/:transactionId`, () => {
    return HttpResponse.json({ success: true });
  }),
  
  http.post(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/:patternId/adjust-pattern`, () => {
    return HttpResponse.json({ success: true });
  })
]; 