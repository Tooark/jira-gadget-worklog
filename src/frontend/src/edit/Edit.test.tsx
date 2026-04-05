import { fireEvent, render, screen } from '@testing-library/react';

import type { EditProps, View } from '../types';
import Edit from './Edit';

function makeProps(): EditProps {
  return {
    formValues: {
      days: 7,
      color: 'color',
      jql: '',
      users: [],
    },
    view: { submit: jest.fn() } as unknown as View,
  };
}

it.each(['Salvar', 'Cancelar'])('renderiza o botao %p', (text) => {
  const props = makeProps();
  render(<Edit {...props} />);
  expect(screen.getByRole('button', { name: text })).toBeInTheDocument();
});

it.each(['Dias', 'Cor do Gráfico', 'Usuários', 'JQL Adicional'])('renderiza o label %p', (text) => {
  const props = makeProps();
  render(<Edit {...props} />);
  expect(screen.getByText(text)).toBeInTheDocument();
});

it('submete o formulario ao salvar', () => {
  const props = makeProps();
  render(<Edit {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  expect(props.view.submit).toHaveBeenCalledTimes(1);
  expect(props.view.submit).toHaveBeenCalledWith({
    days: 7,
    color: 'color',
    jql: '',
    users: [],
  });
});

it('restaura valores ao cancelar', () => {
  const props = makeProps();
  render(<Edit {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(props.view.submit).toHaveBeenCalledTimes(1);
  expect(props.view.submit).toHaveBeenCalledWith(props.formValues);
});
