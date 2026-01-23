'use client';
import { Award, Star, ShieldCheck } from 'lucide-react';

export default function BadgeNotification({ badges }) {
  return (
    <div className="p-6 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl shadow-2xl border-4 border-white/30 backdrop-blur-xl max-w-md mx-auto transform transition-all hover:scale-105">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/20 rounded-2xl backdrop-blur">
          <Award className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white drop-shadow-lg">Nouveaux badges !</h3>
          <p className="text-white/90 text-sm">Félicitations 🎉</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {badges.map((badge, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-lg border border-white/30 hover:bg-white/30 transition-all">
            <span className="text-3xl drop-shadow-md">{badge.emoji}</span>
            <div>
              <div className="font-bold text-white text-lg">{badge.nom}</div>
              <div className="text-white/80 text-xs">{badge.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
