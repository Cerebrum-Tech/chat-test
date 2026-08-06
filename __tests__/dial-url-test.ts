import { dialUrlCandidates } from '../services/dialUrl';

describe('dialUrlCandidates', () => {
  it('falls back to the bare number when the catalog supplies a post-dial suffix', () => {
    // The customer-service chip's exact catalog value. iOS declines the comma form, so
    // without the second candidate the button does nothing at all.
    expect(dialUrlCandidates('tel:4440222,1')).toEqual(['tel:4440222,1', 'tel:4440222']);
  });

  it('treats the wait character the same as the pause character', () => {
    expect(dialUrlCandidates('tel:4440222;1')).toEqual(['tel:4440222;1', 'tel:4440222']);
  });

  it('offers one candidate when there is no suffix to drop', () => {
    expect(dialUrlCandidates('tel:+902120000000')).toEqual(['tel:+902120000000']);
  });

  it('does not offer a bare scheme when the URL is nothing but a suffix', () => {
    // `tel:` alone dials nothing; a second attempt would just fail twice.
    expect(dialUrlCandidates('tel:,1')).toEqual(['tel:,1']);
  });

  it('passes other schemes through untouched', () => {
    // A comma is legal in a query string — rewriting one of these would corrupt the target.
    expect(dialUrlCandidates('https://example.test/a?ids=1,2')).toEqual([
      'https://example.test/a?ids=1,2',
    ]);
    expect(dialUrlCandidates('mailto:support@example.test')).toEqual([
      'mailto:support@example.test',
    ]);
  });

  it('preserves the scheme as authored and tolerates surrounding space', () => {
    expect(dialUrlCandidates('  TEL:4440222,1  ')).toEqual(['TEL:4440222,1', 'TEL:4440222']);
  });
});
