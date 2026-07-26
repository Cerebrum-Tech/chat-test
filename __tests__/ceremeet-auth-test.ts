import {
  CEREMEET_USER_ME_URL,
  CEREMEET_WATERS_LOGIN_URL,
  deriveConsumerId,
  verifyCereMeetUser,
  watersLogin,
} from '../services/ceremeetAuth';

const jsonResponse = (status: number, body: unknown): Response =>
  ({ status, json: async () => body }) as unknown as Response;

const watersUser = {
  data: {
    user: {
      email: '01391bfb-e4cc-eb11-9c21-005056b20185@nestlewatersapp.com',
      isWatersUser: true,
    },
  },
};

describe('verifyCereMeetUser', () => {
  it('authorizes a Waters user and derives the CRM consumer id from the email', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, watersUser));

    const result = await verifyCereMeetUser('  ceremeet-jwt-value  ', { fetchImpl });

    expect(result).toEqual({
      authenticated: true,
      email: '01391bfb-e4cc-eb11-9c21-005056b20185@nestlewatersapp.com',
      consumerId: '01391bfb-e4cc-eb11-9c21-005056b20185',
      isWatersUser: true,
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(CEREMEET_USER_ME_URL);
    // The credential travels in the header only — never a query parameter, which would
    // leak into referers and access logs.
    expect(init.headers.Authorization).toBe('Bearer ceremeet-jwt-value');
    expect(url).not.toContain('ceremeet-jwt-value');
  });

  it('rejects an account that is not flagged as a Waters user', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse(200, { data: { user: { email: 'someone@example.test', isWatersUser: false } } }),
    );

    const result = await verifyCereMeetUser('token', { fetchImpl });

    expect(result.authenticated).toBe(false);
    expect(result.reason).toBe('not_waters_user');
    expect(result.consumerId).toBeUndefined();
  });

  it('reports the backend reason code for each failure shape', async () => {
    expect(await verifyCereMeetUser('   ')).toEqual({
      authenticated: false,
      isWatersUser: false,
      reason: 'missing_token',
    });

    expect(
      (await verifyCereMeetUser('token', { fetchImpl: jest.fn().mockResolvedValue(jsonResponse(401, {})) }))
        .reason,
    ).toBe('ceremeet_api_status_401');

    expect(
      (await verifyCereMeetUser('token', { fetchImpl: jest.fn().mockRejectedValue(new Error('offline')) }))
        .reason,
    ).toBe('ceremeet_api_unreachable');

    const badJson = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);
    expect((await verifyCereMeetUser('token', { fetchImpl: badJson })).reason).toBe(
      'ceremeet_api_invalid_response',
    );

    expect(
      (await verifyCereMeetUser('token', { fetchImpl: jest.fn().mockResolvedValue(jsonResponse(200, { data: {} })) }))
        .reason,
    ).toBe('no_user_in_response');
  });

  it('never calls out when the token is blank', async () => {
    const fetchImpl = jest.fn();
    await verifyCereMeetUser('', { fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('watersLogin', () => {
  const LOGIN_OK = {
    status: 'success',
    access_token: 'minted-access-token',
    refresh_token: 'minted-refresh-token',
    userInfo: { email: 'customer-guid@nestlewatersapp.com', isWatersUser: true },
  };

  it('exchanges a customer id for that customer access token', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, LOGIN_OK));

    const result = await watersLogin('  customer-guid  ', { apiKey: 'service-key', fetchImpl });

    expect(result).toEqual({
      ok: true,
      accessToken: 'minted-access-token',
      email: 'customer-guid@nestlewatersapp.com',
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(CEREMEET_WATERS_LOGIN_URL);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer service-key');
    expect(JSON.parse(init.body)).toEqual({ customer_id: 'customer-guid' });
  });

  it('refuses to call out without a customer id or a login key', async () => {
    const fetchImpl = jest.fn();
    expect(await watersLogin('   ', { apiKey: 'service-key', fetchImpl })).toEqual({
      ok: false,
      reason: 'missing_customer_id',
    });
    expect(await watersLogin('customer-guid', { apiKey: '  ', fetchImpl })).toEqual({
      ok: false,
      reason: 'missing_login_key',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports a distinct reason code for each login failure shape', async () => {
    const failing = async (impl: jest.Mock) =>
      (await watersLogin('customer-guid', { apiKey: 'service-key', fetchImpl: impl })).reason;

    expect(await failing(jest.fn().mockResolvedValue(jsonResponse(401, {})))).toBe(
      'ceremeet_login_status_401',
    );
    expect(await failing(jest.fn().mockRejectedValue(new Error('offline')))).toBe(
      'ceremeet_login_unreachable',
    );
    expect(
      await failing(
        jest.fn().mockResolvedValue({
          status: 200,
          json: async () => {
            throw new Error('not json');
          },
        } as unknown as Response),
      ),
    ).toBe('ceremeet_login_invalid_response');
    expect(await failing(jest.fn().mockResolvedValue(jsonResponse(200, { status: 'success' })))).toBe(
      'no_token_in_login_response',
    );
  });

  it('never puts the customer id or the service key in the URL', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, LOGIN_OK));
    await watersLogin('customer-guid', { apiKey: 'service-key', fetchImpl });
    const [url] = fetchImpl.mock.calls[0];
    expect(url).not.toContain('customer-guid');
    expect(url).not.toContain('service-key');
  });
});

describe('deriveConsumerId', () => {
  it('takes the local part of the email, matching the backend derivation', () => {
    expect(deriveConsumerId('01391bfb-e4cc@nestlewatersapp.com')).toBe('01391bfb-e4cc');
    expect(deriveConsumerId('no-at-sign')).toBe('no-at-sign');
    expect(deriveConsumerId('')).toBe('');
  });
});
