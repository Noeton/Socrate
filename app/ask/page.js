'use client';

import ProtectedPage from '../components/ProtectedPage';
import ChatInterface from '../components/ChatInterface';

export default function AskPage() {
  return (
    <ProtectedPage>
      <ChatInterface mode="ask" />
    </ProtectedPage>
  );
}