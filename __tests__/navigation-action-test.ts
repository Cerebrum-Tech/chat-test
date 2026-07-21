import { parseNavigationRequest } from '../services/navigationAction';

const valid = {
  output_type: 'navigation',
  process: 'GotoPage',
  data: { page_name: 'MainPage' },
};

describe('parseNavigationRequest', () => {
  it('maps the exact lowercase action immediately to /main-page', () => {
    expect(parseNavigationRequest(JSON.stringify(valid))).toEqual({ pathname: '/main-page' });
  });

  it('preserves an optional nonblank case_id', () => {
    expect(
      parseNavigationRequest(JSON.stringify({
        ...valid,
        data: { ...valid.data, case_id: '6f9619ff-8b86-d011-b42d-00c04fc964ff' },
      })),
    ).toEqual({
      pathname: '/main-page',
      params: { case_id: '6f9619ff-8b86-d011-b42d-00c04fc964ff' },
    });
  });

  it.each([
    '',
    '{',
    JSON.stringify(null),
    JSON.stringify({ Process: 'GotoPage', Data: { PageName: 'MainPage', CaseId: 'legacy' } }),
    JSON.stringify({ ...valid, output_type: 'text' }),
    JSON.stringify({ ...valid, process: 'OpenPage' }),
    JSON.stringify({ ...valid, data: { page_name: 'OtherPage' } }),
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', case_id: '' } }),
    JSON.stringify({ ...valid, extra: true }),
    JSON.stringify({ ...valid, data: { page_name: 'MainPage', extra: true } }),
  ])('rejects malformed, unknown, extra, or legacy input', (raw) => {
    expect(parseNavigationRequest(raw)).toBeNull();
  });
});
