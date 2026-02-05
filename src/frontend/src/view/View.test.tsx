import { render, screen } from '@testing-library/react';

import View from './View';
import type { ViewProps } from '../types';

it('renders text and form values', () => {
  const props: ViewProps = {
    formValues: {
      // campos esperados por FormValues
      days: 7,
      color: 'color',
      jql: '',
      users: [],
    }
  };
  render(<View {...props} />);
  // Heading with text
  expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(props.formValues.color);
  // formValues JSON displayed in a pre
  expect(screen.getByText(/"name": "name"/)).toBeInTheDocument();
  expect(screen.getByText(/"description": "description"/)).toBeInTheDocument();
  // Name and Description labels are present
  expect(screen.getByText('Name:')).toBeInTheDocument();
  expect(screen.getByText('Description:')).toBeInTheDocument();
});
