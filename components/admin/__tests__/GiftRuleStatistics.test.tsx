import { render, screen } from '@testing-library/react';
import GiftRuleStatistics from '../GiftRuleStatistics';

describe('GiftRuleStatistics', () => {
  const mockStatistics = {
    totalUses: 15,
    uniqueUsers: 8,
    totalValueGiven: 450.5,
    usageByProduct: [
      {
        productId: 'prod1',
        productName: 'Product A',
        count: 10,
        totalValue: 300,
      },
      {
        productId: 'prod2',
        productName: 'Product B',
        count: 5,
        totalValue: 150.5,
      },
    ],
    usageOverTime: [
      { date: '2024-01-01', count: 3 },
      { date: '2024-01-02', count: 5 },
      { date: '2024-01-03', count: 7 },
    ],
  };

  it('renders summary cards with correct values', () => {
    render(<GiftRuleStatistics statistics={mockStatistics} />);

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/450[.,]50/)).toBeInTheDocument();
  });

  it('renders usage over time chart', () => {
    render(<GiftRuleStatistics statistics={mockStatistics} />);

    expect(screen.getByText('Utilizări în Timp')).toBeInTheDocument();
  });

  it('renders usage by product section', () => {
    render(<GiftRuleStatistics statistics={mockStatistics} />);

    expect(screen.getByText('Utilizări pe Produs')).toBeInTheDocument();
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });

  it('renders product breakdown table', () => {
    render(<GiftRuleStatistics statistics={mockStatistics} />);

    expect(screen.getByText('Detalii Produse')).toBeInTheDocument();
  });

  it('displays empty state when no usage data', () => {
    const emptyStats = {
      totalUses: 0,
      uniqueUsers: 0,
      totalValueGiven: 0,
      usageByProduct: [],
      usageOverTime: [],
    };

    render(<GiftRuleStatistics statistics={emptyStats} />);

    expect(screen.getByText('Nu există date de utilizare încă')).toBeInTheDocument();
    expect(screen.getByText('Nu există produse cadou utilizate încă')).toBeInTheDocument();
  });

  it('calculates percentages correctly', () => {
    render(<GiftRuleStatistics statistics={mockStatistics} />);

    // Product A: 10/15 = 66.7%
    expect(screen.getByText(/66\.7%/)).toBeInTheDocument();
    // Product B: 5/15 = 33.3%
    expect(screen.getByText(/33\.3%/)).toBeInTheDocument();
  });
});
