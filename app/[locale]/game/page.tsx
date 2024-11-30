'use client';  // 因为游戏需要客户端交互

import React from 'react';
import AlpacaGame from '@/components/AlpacaGame';

export default function GamePage() {
  return (
    <div className="container mx-auto py-8">
      <AlpacaGame />
    </div>
  );
}
