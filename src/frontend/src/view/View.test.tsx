import { render, screen } from '@testing-library/react';

import { useForgeInvoke } from '../hooks';
import View from './View';

const mockReactECharts = jest.fn();

jest.mock('../hooks', () => ({
  useForgeInvoke: jest.fn(),
}));

jest.mock('echarts-for-react', () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockReactECharts(props);
    return <div data-testid="react-echarts" />;
  },
}));

const mockedUseForgeInvoke = jest.mocked(useForgeInvoke);

describe('View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invoca getWorklog com payload da configuracao', () => {
    mockedUseForgeInvoke.mockReturnValueOnce([]);

    render(
      <View
        formValues={{
          days: 7,
          color: 'blue',
          jql: 'project = TEST',
          users: ['u1'],
        }}
      />,
    );

    expect(mockedUseForgeInvoke).toHaveBeenCalledWith('getWorklog', {
      days: 7,
      color: 'blue',
      query: 'project = TEST',
      users: ['u1'],
    });
    expect(screen.getByTestId('react-echarts')).toBeInTheDocument();
  });

  it('normaliza dias negativos para 7', () => {
    mockedUseForgeInvoke.mockReturnValueOnce([]);

    render(
      <View
        formValues={{
          days: -3,
          color: 'color',
          jql: '',
          users: [],
        }}
      />,
    );

    expect(mockedUseForgeInvoke).toHaveBeenCalledWith(
      'getWorklog',
      expect.objectContaining({ days: 7 }),
    );
  });

  it('monta o titulo com total de horas no nivel raiz', () => {
    mockedUseForgeInvoke.mockReturnValueOnce([
      { name: 'User One', value: 1.2, color: '#111' },
      { name: 'User Two', value: 2.3, color: '#222' },
    ] as any);

    render(
      <View
        formValues={{
          days: 7,
          color: 'color',
          jql: '',
          users: [],
        }}
      />,
    );

    const chartProps = mockReactECharts.mock.calls.at(-1)?.[0] as
      | { option?: { title?: { text?: string } } }
      | undefined;

    expect(chartProps?.option?.title?.text).toContain('Worklog dos');
    expect(chartProps?.option?.title?.text).toContain('7 dias');
    expect(chartProps?.option?.title?.text).toContain('Total: 3.5h');
  });
});
