import React from 'react';
import { render, screen } from '@testing-library/react';
import AppRoot from './AppRoot';

test('renders learn react link', () => {
  render(<AppRoot />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
