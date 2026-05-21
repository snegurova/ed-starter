import { NextResponse } from 'next/server';
import { readFlights } from '@/lib/flights';
import { ALL_STATUSES } from '@/types';

export async function GET() {
  const flights = readFlights();

  const stats = Object.fromEntries(
    ALL_STATUSES.map((status) => [
      status,
      flights.filter((f) => f.status === status).length,
    ])
  );

  return NextResponse.json(stats);
}
