import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
  workId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({ 
  workId, 
  size = 'md', 
  showLabel = false,
  onToggle 
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(workId));
  }, [workId]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites: string[];
    
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== workId);
    } else {
      newFavorites = [...favorites, workId];
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    onToggle?.(!isFavorite);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`favorite-btn ${sizeClasses[size]} ${isFavorite ? 'active' : ''} 
        inline-flex items-center justify-center gap-2 rounded-full 
        ${isFavorite 
          ? 'bg-vermillion/10 text-vermillion' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-vermillion hover:bg-vermillion/10'
        } 
        transition-all duration-300 group`}
      aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
    >
      <svg
        className={`${iconSizes[size]} transition-transform duration-300 ${
          isAnimating ? 'animate-heartbeat' : ''
        } ${isFavorite ? 'scale-110' : 'group-hover:scale-110'}`}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      
      {showLabel && (
        <span className="text-sm font-medium">
          {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
        </span>
      )}
      
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute w-1 h-1 bg-vermillion rounded-full"
              style={{
                left: '50%',
                top: '50%',
                animation: 'confetti 0.6s ease-out forwards',
                animationDelay: `${i * 0.05}s`,
                transform: `rotate(${i * 60}deg) translateY(-20px)`
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
