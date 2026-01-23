'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  return (
    <div className="text-center">
      <div className="text-6xl mb-4">❌</div>
      <h1 className="text-2xl font-bold mb-4">Erreur de connexion</h1>
      <p className="text-gray-600 mb-6">
        {error === 'Configuration' && 'Problème de configuration'}
        {error === 'AccessDenied' && 'Accès refusé'}
        {error === 'Verification' && 'Vérification échouée'}
        {!error && 'Une erreur est survenue'}
      </p>
      <Link 
        href="/login"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Réessayer
      </Link>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <Suspense fallback={<div className="text-center">Chargement...</div>}>
          <AuthErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
