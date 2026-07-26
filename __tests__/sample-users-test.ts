import { readSampleUsers } from '../services/sampleUsers';

describe('readSampleUsers', () => {
  it('keeps only slots that carry a customer id and trims the values', () => {
    const users = readSampleUsers([
      { slot: 1, label: '  Test Müşteri 1  ', customerId: '  customer-one  ' },
      { slot: 2, label: 'No id', customerId: '   ' },
      { slot: 3, label: undefined, customerId: 'customer-three' },
      { slot: 4, label: 'No id either', customerId: undefined },
    ]);

    expect(users).toEqual([
      { id: 'sample-user-1', label: 'Test Müşteri 1', customerId: 'customer-one' },
      // An unlabelled slot falls back to showing the customer id itself.
      { id: 'sample-user-3', label: 'customer-three', customerId: 'customer-three' },
    ]);
  });

  it('returns an empty list when nothing is configured', () => {
    expect(readSampleUsers([])).toEqual([]);
    expect(readSampleUsers([{ slot: 1 }])).toEqual([]);
  });

  it('ignores unsupported value types', () => {
    const slots = [
      { slot: 1, label: 42, customerId: 'customer-one' },
      { slot: 2, label: 'Bad id', customerId: {} },
    ] as unknown as Parameters<typeof readSampleUsers>[0];

    expect(readSampleUsers(slots)).toEqual([
      { id: 'sample-user-1', label: 'customer-one', customerId: 'customer-one' },
    ]);
  });
});
