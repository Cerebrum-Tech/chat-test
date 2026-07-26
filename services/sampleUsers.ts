import type { SampleUser, SampleUserSlot } from '../types/auth';

/**
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time through a Babel transform, so
 * every variable has to be referenced as a static literal — `process.env[name]` resolves
 * to undefined in a bundled app. That is why these are five fixed slots instead of a loop.
 */
const CONFIGURED_SLOTS: SampleUserSlot[] = [
  {
    slot: 1,
    label: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_1_LABEL,
    customerId: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_1_CUSTOMER_ID,
  },
  {
    slot: 2,
    label: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_2_LABEL,
    customerId: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_2_CUSTOMER_ID,
  },
  {
    slot: 3,
    label: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_3_LABEL,
    customerId: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_3_CUSTOMER_ID,
  },
  {
    slot: 4,
    label: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_4_LABEL,
    customerId: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_4_CUSTOMER_ID,
  },
  {
    slot: 5,
    label: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_5_LABEL,
    customerId: process.env.EXPO_PUBLIC_CAI_SAMPLE_USER_5_CUSTOMER_ID,
  },
];

const asTrimmedString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/**
 * Project the configured slots into the sample users offered on the login screen.
 *
 * A slot counts as configured only when it carries a non-blank customer id; the label is
 * cosmetic and falls back to the id itself. Customer ids are CRM identifiers, not
 * credentials — the token is minted at sign-in from the id plus the watersLogin API key.
 */
export const readSampleUsers = (slots: SampleUserSlot[] = CONFIGURED_SLOTS): SampleUser[] =>
  slots.reduce<SampleUser[]>((users, entry) => {
    const customerId = asTrimmedString(entry?.customerId);
    if (!customerId) return users;
    users.push({
      id: `sample-user-${entry.slot}`,
      label: asTrimmedString(entry?.label) ?? customerId,
      customerId,
    });
    return users;
  }, []);
