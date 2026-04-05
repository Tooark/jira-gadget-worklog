// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('@forge/bridge', () => ({
  invoke: jest.fn().mockResolvedValue(undefined),
  view: {
    getContext: jest.fn().mockResolvedValue(undefined),
    submit: jest.fn(),
  },
}));

jest.mock('@atlaskit/platform-feature-flags', () => ({
  fg: jest.fn().mockReturnValue(false),
}));

jest.mock('../src/env');

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const firstArg = args[0];

    // Ignora aviso conhecido de feature gate no ambiente de teste.
    if (
      firstArg &&
      typeof firstArg === 'object' &&
      'msg' in firstArg &&
      (firstArg as { msg?: unknown }).msg ===
        'An error has occurred checking the feature gate. Only the first occurrence of this error is logged.'
    ) {
      return;
    }

    // Mantem o output dos testes limpo; os casos relevantes sao verificados por assercoes.
    return;
  });

  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const firstArg = args[0];
    const serialized = args
      .map((arg) => (typeof arg === 'string' ? arg : ''))
      .join(' ');

    // Ignora warning legado de contexto do analytics-next durante render.
    if (
      (typeof firstArg === 'string' || serialized.length > 0) &&
      (String(firstArg).includes('legacy childContextTypes API') ||
        serialized.includes('legacy childContextTypes API'))
    ) {
      return;
    }

    // Mantem o output dos testes limpo; os casos relevantes sao verificados por assercoes.
    return;
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});
