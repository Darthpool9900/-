
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Game = dynamic(() => import('../src/Game').then(m => m.default), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={<div style={{display:'grid',placeItems:'center',height:'100vh'}}>Carregando...</div>}>
      <Game />
    </Suspense>
  );
}
