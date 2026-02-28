'use client';

import { use } from 'react';
import { PrsiRoom } from '@/components/game/prsi/PrsiRoom';

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default function PrsiRoomPage({ params }: PageProps) {
  const { roomCode } = use(params);
  return <PrsiRoom roomCode={roomCode} />;
}
