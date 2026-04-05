// Test scaffold for src/backend/index.js

jest.mock('@forge/resolver', () => ({
  __esModule: true,
  default: class Resolver {
    constructor() { this.definitions = {}; }
    /**
     * @param {string | number} name
     * @param {any} fn
     */
    define(name, fn) { this.definitions[name] = fn; }
    getDefinitions() { return this.definitions; }
  }
}));

const mockRequestJira = jest.fn();

jest.mock('@forge/api', () => ({
  __esModule: true,
  default: { asApp: () => ({ requestJira: mockRequestJira }) },
  route: (/** @type {any[]} */ strings, /** @type {{ [x: string]: any; }} */ ...values) => strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '')
}));

// Import after mocks
import { createData, getDataUsers, getDataIssues } from './index.js';

describe('backend/index.js - scaffold tests', () => {
  describe('createData', () => {
    test('converte a estrutura em nodes de saída preservando cores e ordem', () => {
      const data = {
        'Alice': {
          value: 8,
          days: {
            '2026-02-01': {
              value: 4,
              issues: {
                'ISS-1': { value: 2, summary: 'Resumo', url: 'http://example.com/ISS-1' }
              }
            }
          }
        },
        'Bob': { value: 5, days: {} }
      };
      const colors = ['#111', '#222'];
      const out = createData(data, colors);
      expect(out).toHaveLength(2);
      expect(out[0].name).toBe('Alice');
      expect(out[0].color).toBe('#111');
      expect(out[0].children[0].name).toBe('2026-02-01');
      expect(out[0].children[0].children[0].name).toBe('ISS-1');
    });
  });

  describe('API helpers (mocks)', () => {
    beforeEach(() => {
      mockRequestJira.mockReset();
    });

    test('getDataUsers normaliza e retorna usuários ativos', async () => {
      mockRequestJira.mockResolvedValueOnce({
        json: async () => ([{ accountId: 'a1', accountType: 'atlassian', active: true, displayName: 'User A', avatarUrls: {} }])
      });

      const users = await getDataUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(1);
      expect(users[0].accountId).toBe('a1');
      expect(users[0].displayName).toBe('User A');
    });

    test('getDataIssues segue paginação recursiva', async () => {
      mockRequestJira
        .mockResolvedValueOnce({ json: async () => ({ issues: [{ id: '1' }], isLast: false, nextPageToken: 't1' }) })
        .mockResolvedValueOnce({ json: async () => ({ issues: [{ id: '2' }], isLast: true }) });

      const issues = await getDataIssues('some jql');
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBe(2);
      expect(issues.map(i => i.id).sort()).toEqual(['1','2']);
    });
  });
});
