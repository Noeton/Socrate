export default function ProgressBar({ value, max, className = '' }) {
    const percentage = Math.min((value / max) * 100, 100);
    
    // Couleur selon progression
    const getColor = () => {
      if (percentage < 25) return 'bg-blue-500';
      if (percentage < 50) return 'bg-green-500';
      if (percentage < 75) return 'bg-yellow-500';
      return 'bg-purple-500';
    };
  
    return (
      <div className={`w-full bg-gray-100 rounded-full h-3 overflow-hidden ${className}`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }