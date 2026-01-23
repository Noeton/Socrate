'use client';

import ProtectedPage from '../components/ProtectedPage';
import LearnDashboard from '../components/LearnDashboard';

export default function LearnPage() {
  return (
    <ProtectedPage>
      <LearnDashboard />
    </ProtectedPage>
  );
}