/**
 * Integration tests require Supabase test credentials.
 * Run with: RUN_INTEGRATION_TESTS=1 npm test -- tests/integration
 */
describe('campaign flow integration', () => {
  const run = process.env.RUN_INTEGRATION_TESTS === '1';

  (run ? it : it.skip)('placeholder: signup → campaign → metrics', () => {
    expect(true).toBe(true);
  });

  (run ? it : it.skip)('placeholder: empire os recommendation flow', () => {
    expect(true).toBe(true);
  });
});
