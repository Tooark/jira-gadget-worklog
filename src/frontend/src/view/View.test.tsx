import { render, screen } from '@testing-library/react';

import View from './View';

it('renders text and form values', () => {
  const props = {
    formValues: { name: 'name', description: 'description' },
    text: 'text',
  };
  render(<View {...props} />);
  // Heading with text
  expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(props.text);
  // formValues JSON displayed in a pre
  expect(screen.getByText(/"name": "name"/)).toBeInTheDocument();
  expect(screen.getByText(/"description": "description"/)).toBeInTheDocument();
  // Name and Description labels are present
  expect(screen.getByText('Name:')).toBeInTheDocument();
  expect(screen.getByText('Description:')).toBeInTheDocument();
});
