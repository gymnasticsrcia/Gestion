'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Login is now handled via modal on the landing page (app/page.tsx).
// This route redirects back to root so the modal can be opened there.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
