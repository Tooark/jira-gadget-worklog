import { fireEvent, render, screen } from '@testing-library/react';

import type { EditProps, View } from '../types';
import Edit from './Edit';

const props: EditProps = {
  formValues: {
    // campos esperados por FormValues
    days: 7,
    color: 'color',
    jql: '',
    users: [],
  },
  view: { submit: jest.fn() } as unknown as View,
};

it.each(['Save', 'Cancel'])('renders button %p', (text) => {
  render(<Edit {...props} />);
  expect(screen.getByRole('button', { name: text })).toBeInTheDocument();
});

it.each(['Days', 'Color do Gráfico', 'Usuários', 'JQL Adicional'])('renders label %p', (text) => {
  render(<Edit {...props} />);
  expect(screen.getByLabelText(text)).toBeInTheDocument();
});

it('saves form', () => {
  render(<Edit {...props} />);
  fireEvent.change(screen.getByLabelText('Days'), {
    target: { value: '7' },
  });
  fireEvent.change(screen.getByLabelText('Color do Gráfico'), {
    target: { value: 'color' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(props.view.submit).toHaveBeenCalledTimes(1);
  expect(props.view.submit).toHaveBeenCalledWith({
    days: 7,
    color: 'color',
    jql: '',
    users: [],
  });
});

it('cancels form', () => {
  render(<Edit {...props} />);
  fireEvent.change(screen.getByLabelText('Days'), {
    target: { value: '7' },
  });
  fireEvent.change(screen.getByLabelText('Color do Gráfico'), {
    target: { value: 'color' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(props.view.submit).toHaveBeenCalledTimes(1);
  expect(props.view.submit).toHaveBeenCalledWith(props.formValues);
});
