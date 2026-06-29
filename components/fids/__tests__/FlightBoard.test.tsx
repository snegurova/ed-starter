import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlightBoard } from '../FlightBoard';
import { useFlightsStore, selectFilteredFlights } from '@/store/flightsStore';
import type { Flight } from '@/types';

vi.mock('../LiveClock', () => ({
  LiveClock: () => <span data-testid="live-clock" />,
}));

vi.mock('../FlightRow', () => ({
  FlightRow: ({ flight }: { flight: Flight }) => (
    <div data-testid="flight-row" data-id={flight.id}>
      {flight.flightNumber}
    </div>
  ),
}));

vi.mock('@/store/flightsStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/flightsStore')>();
  return { ...actual, useFlightsStore: vi.fn() };
});

const mockSetFilter = vi.fn();
const mockSetFlights = vi.fn();
const DEFAULT_FILTERS = { terminal: 'All' as const, airline: 'All', status: 'All' as const, destination: '' };

function setupStoreMock(flights: Flight[], filters = DEFAULT_FILTERS) {
  vi.mocked(useFlightsStore).mockImplementation((selector?: unknown) => {
    if (typeof selector === 'function') return flights;
    return { filters, setFilter: mockSetFilter, setFlights: mockSetFlights };
  });
}

const FLIGHTS: Flight[] = [
  {
    id: '1',
    flightNumber: 'LO001',
    airline: 'LOT',
    destination: 'Warsaw',
    departureTime: '10:00',
    terminal: 'T1',
    gate: 'A1',
    status: 'On Time',
  },
  {
    id: '2',
    flightNumber: 'FR002',
    airline: 'Ryanair',
    destination: 'London',
    departureTime: '11:30',
    terminal: 'T2',
    gate: 'B3',
    status: 'Delayed',
    delayMinutes: 30,
  },
  {
    id: '3',
    flightNumber: 'W6003',
    airline: 'Wizz Air',
    destination: 'Paris',
    departureTime: '14:00',
    terminal: 'T1',
    gate: 'C2',
    status: 'Boarding',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FlightBoard — rendering', () => {
  it('renders a row for each flight the store returns', () => {
    setupStoreMock(FLIGHTS);
    render(<FlightBoard initialFlights={FLIGHTS} />);

    expect(screen.getAllByTestId('flight-row')).toHaveLength(3);
    expect(screen.getByText('LO001')).toBeInTheDocument();
    expect(screen.getByText('FR002')).toBeInTheDocument();
    expect(screen.getByText('W6003')).toBeInTheDocument();
  });

  it('displays the brand title', () => {
    setupStoreMock(FLIGHTS);
    render(<FlightBoard initialFlights={FLIGHTS} />);
    expect(screen.getByText('RunwayBriefing')).toBeInTheDocument();
  });

  it('shows plural flight count', () => {
    setupStoreMock(FLIGHTS);
    render(<FlightBoard initialFlights={FLIGHTS} />);
    expect(screen.getByText('3 flights')).toBeInTheDocument();
  });

  it('shows singular "flight" for one result', () => {
    setupStoreMock([FLIGHTS[0]]);
    render(<FlightBoard initialFlights={[FLIGHTS[0]]} />);
    expect(screen.getByText('1 flight')).toBeInTheDocument();
  });

  it('passes initialFlights to the store on mount', () => {
    setupStoreMock(FLIGHTS);
    render(<FlightBoard initialFlights={FLIGHTS} />);
    expect(mockSetFlights).toHaveBeenCalledWith(FLIGHTS);
  });
});

describe('FlightBoard — empty state', () => {
  it('shows empty-state message when store returns no flights', () => {
    setupStoreMock([]);
    render(<FlightBoard initialFlights={[]} />);

    expect(screen.getByText('No flights match the current filters.')).toBeInTheDocument();
    expect(screen.queryByTestId('flight-row')).toBeNull();
  });
});

describe('FlightBoard — filter interactions', () => {
  it('calls setFilter with terminal value when terminal select changes', () => {
    setupStoreMock(FLIGHTS);
    render(<FlightBoard initialFlights={FLIGHTS} />);

    const [terminalSelect] = screen.getAllByRole('combobox');
    fireEvent.change(terminalSelect, { target: { value: 'T1' } });

    expect(mockSetFilter).toHaveBeenCalledWith('terminal', 'T1');
  });

  it('calls setFilter with airline value when airline select changes', () => {
    setupStoreMock(FLIGHTS);
    render(<FlightBoard initialFlights={FLIGHTS} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'Ryanair' } });

    expect(mockSetFilter).toHaveBeenCalledWith('airline', 'Ryanair');
  });

  it('calls setFilter with status value when status select changes', () => {
    setupStoreMock(FLIGHTS);
    render(<FlightBoard initialFlights={FLIGHTS} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: 'Delayed' } });

    expect(mockSetFilter).toHaveBeenCalledWith('status', 'Delayed');
  });

  it('calls setFilter with destination text as user types', () => {
    setupStoreMock(FLIGHTS);
    render(<FlightBoard initialFlights={FLIGHTS} />);

    const input = screen.getByPlaceholderText('Destination...');
    fireEvent.change(input, { target: { value: 'War' } });

    expect(mockSetFilter).toHaveBeenCalledWith('destination', 'War');
  });
});

describe('selectFilteredFlights — terminal filter', () => {
  const makeState = (overrides: object) => ({
    flights: FLIGHTS,
    filters: { ...DEFAULT_FILTERS, ...overrides },
    setFlights: vi.fn(),
    setFilter: vi.fn(),
    updateFlight: vi.fn(),
    addFlight: vi.fn(),
    removeFlight: vi.fn(),
    resetFlights: vi.fn(),
  });

  it('returns all flights when terminal is All', () => {
    expect(selectFilteredFlights(makeState({}))).toHaveLength(3);
  });

  it('returns only T1 flights', () => {
    const result = selectFilteredFlights(makeState({ terminal: 'T1' }));
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.terminal === 'T1')).toBe(true);
  });

  it('returns only T2 flights', () => {
    const result = selectFilteredFlights(makeState({ terminal: 'T2' }));
    expect(result).toHaveLength(1);
    expect(result[0].flightNumber).toBe('FR002');
  });

  it('returns empty array when no flights match the terminal', () => {
    const noT2Flights = FLIGHTS.filter((f) => f.terminal !== 'T2');
    expect(selectFilteredFlights({ ...makeState({ terminal: 'T2' }), flights: noT2Flights })).toHaveLength(0);
  });
});

describe('selectFilteredFlights — destination filter', () => {
  const makeState = (destination: string) => ({
    flights: FLIGHTS,
    filters: { ...DEFAULT_FILTERS, destination },
    setFlights: vi.fn(),
    setFilter: vi.fn(),
    updateFlight: vi.fn(),
    addFlight: vi.fn(),
    removeFlight: vi.fn(),
    resetFlights: vi.fn(),
  });

  it('matches destination case-insensitively', () => {
    expect(selectFilteredFlights(makeState('war'))).toHaveLength(1);
    expect(selectFilteredFlights(makeState('WAR'))).toHaveLength(1);
  });

  it('matches partial destination strings', () => {
    const result = selectFilteredFlights(makeState('on'));
    expect(result.some((f) => f.destination === 'London')).toBe(true);
  });

  it('returns no flights for a destination with no match', () => {
    expect(selectFilteredFlights(makeState('XYZ_NO_MATCH'))).toHaveLength(0);
  });

  it('returns all flights when destination is empty', () => {
    expect(selectFilteredFlights(makeState(''))).toHaveLength(3);
  });
});

describe('selectFilteredFlights — status filter', () => {
  const makeState = (status: string) => ({
    flights: FLIGHTS,
    filters: { ...DEFAULT_FILTERS, status: status as never },
    setFlights: vi.fn(),
    setFilter: vi.fn(),
    updateFlight: vi.fn(),
    addFlight: vi.fn(),
    removeFlight: vi.fn(),
    resetFlights: vi.fn(),
  });

  it('filters by Delayed status', () => {
    const result = selectFilteredFlights(makeState('Delayed'));
    expect(result).toHaveLength(1);
    expect(result[0].flightNumber).toBe('FR002');
  });

  it('returns empty when no flights match the status', () => {
    expect(selectFilteredFlights(makeState('Cancelled'))).toHaveLength(0);
  });
});
