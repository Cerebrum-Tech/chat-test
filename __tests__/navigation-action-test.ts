import { parseNavigationRequest } from '../services/navigationAction';

const valid = {
  output_type: 'navigation',
  process: 'GotoPage',
  data: { page_name: 'MainPage' },
};

const parse = (data: Record<string, unknown>) =>
  parseNavigationRequest(JSON.stringify({ ...valid, data: { ...valid.data, ...data } }));

describe('parseNavigationRequest', () => {
  it('maps the exact lowercase action immediately to /main-page', () => {
    expect(parseNavigationRequest(JSON.stringify(valid))).toEqual({ pathname: '/main-page' });
  });

  it('preserves an optional nonblank case_id', () => {
    const caseId = '  6f9619ff-8b86-d011-b42d-00c04fc964ff\t';

    expect(parse({ case_id: caseId })).toEqual({
      pathname: '/main-page',
      params: { case_id: caseId },
    });
  });

  it('preserves an optional nonblank address_id', () => {
    // Which address the main page opens on. Independent of case_id: a navigation can
    // carry either, both, or neither.
    const addressId = '8b0b3f2e-1c4d-4a77-9f1e-2b6d5c7a9e31';

    expect(parse({ address_id: addressId })).toEqual({
      pathname: '/main-page',
      params: { address_id: addressId },
    });
  });

  it('preserves both ids together', () => {
    expect(parse({ case_id: 'incident-1', address_id: 'address-1' })).toEqual({
      pathname: '/main-page',
      params: { case_id: 'incident-1', address_id: 'address-1' },
    });
  });

  it.each(['', ' \t\n '])('omits a blank case_id while preserving navigation', (caseId) => {
    expect(parse({ case_id: caseId })).toEqual({ pathname: '/main-page' });
  });

  it.each(['', ' \t\n '])('omits a blank address_id while preserving navigation', (addressId) => {
    expect(parse({ address_id: addressId })).toEqual({ pathname: '/main-page' });
  });

  it('drops only the blank id, keeping the one that has a value', () => {
    expect(parse({ case_id: 'incident-1', address_id: '  ' })).toEqual({
      pathname: '/main-page',
      params: { case_id: 'incident-1' },
    });
  });

  describe('ProfileScreen', () => {
    const profile = (data: Record<string, unknown> = {}) =>
      parseNavigationRequest(
        JSON.stringify({ ...valid, data: { page_name: 'ProfileScreen', ...data } }),
      );

    it('maps the bare envelope to /profile-screen', () => {
      expect(profile()).toEqual({ pathname: '/profile-screen' });
    });

    it('preserves a nonblank address_id byte-for-byte', () => {
      const addressId = ' 8b0b3f2e-1c4d-4a77-9f1e-2b6d5c7a9e31\t';

      expect(profile({ address_id: addressId })).toEqual({
        pathname: '/profile-screen',
        params: { address_id: addressId },
      });
    });

    it.each(['', ' \t\n '])('omits a blank address_id while preserving navigation', (addressId) => {
      expect(profile({ address_id: addressId })).toEqual({ pathname: '/profile-screen' });
    });

    it.each([
      // The X button carries no incident, so case_id is an unknown key on this page.
      { case_id: 'incident-1' },
      { address_id: 'a', case_id: 'c' },
      { address_id: 42 },
      { address_id: null },
      { extra: true },
    ])('rejects keys or types outside its allowlist', (data) => {
      expect(profile(data)).toBeNull();
    });
  });

  it.each([
    '',
    '{',
    // page_name is case-sensitive and must be an own key of the route table.
    JSON.stringify({ ...valid, data: { page_name: 'profilescreen' } }),
    JSON.stringify({ ...valid, data: { page_name: 'toString' } }),
    JSON.stringify({ ...valid, data: { page_name: 42 } }),
    JSON.stringify(null),
    JSON.stringify({ Process: 'GotoPage', Data: { PageName: 'MainPage', CaseId: 'legacy' } }),
    JSON.stringify({ ...valid, output_type: 'text' }),
    JSON.stringify({ ...valid, process: 'OpenPage' }),
    JSON.stringify({ ...valid, data: { page_name: 'OtherPage' } }),
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', case_id: 42 } }),
    // A non-string address_id is fatal for the same reason a non-string case_id is: the
    // route param has to be a string, and guessing at a coercion would navigate on junk.
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', address_id: 42 } }),
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', address_id: null } }),
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', address_id: { id: 'x' } } }),
    JSON.stringify({ ...valid, extra: true }),
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', extra: true } }),
    // Widening data to two known ids must not widen it to unknown ones.
    JSON.stringify({
      ...valid,
      data: { page_name: 'MainPage', case_id: 'c', address_id: 'a', extra: true },
    }),
  ])('rejects malformed, unknown, extra, or legacy input', (raw) => {
    expect(parseNavigationRequest(raw)).toBeNull();
  });
});
