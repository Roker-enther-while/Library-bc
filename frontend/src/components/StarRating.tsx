'use client';

import { useState } from 'react';

interface StarRatingProps {
    rating: number;
    totalReviews?: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onRate?: (rating: number) => void;
    showCount?: boolean;
}

export default function StarRating({
    rating,
    totalReviews = 0,
    size = 'md',
    interactive = false,
    onRate,
    showCount = true
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };
    const handleClick = (value: number) => {
        if (interactive && onRate) {
            onRate(value);
            setHasRated(true);
        }
    };
    const displayRating = hoverRating || rating;
    return (
        <div className="inline-flex items-center gap-2">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`${interactive ? 'cursor-pointer' : 'cursor-default'} ${sizeClasses[size]} transition-all duration-200`}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => interactive && setHoverRating(star)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        disabled={!interactive}
                    >
                        {star <= displayRating ? (
                            <svg
                                className={`${sizeClasses[size]} text-amber-400`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ) : star - 0.5 <= displayRating ? (
                            <svg className={`${sizeClasses[size]} text-amber-400`} viewBox="0 0 20 20">
                                <defs>
                                    <linearGradient id={`half-${star}`}>
                                        <stop offset="50%" stopColor="currentColor" />
                                        <stop offset="50%" stopColor="#d1d5db" />
                                    </linearGradient>
                                </defs>
                                <path
                                    fill={`url(#half-${star})`}
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                />
                            </svg>
                        ) : (
                            <svg
                                className={`${sizeClasses[size]} text-gray-300`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        )}
                    </button>
                ))}
            </div>

            {showCount && (
                <span className="text-sm text-gray-500">
                    {rating.toFixed(1)} {totalReviews > 0 && `(${totalReviews} đánh giá)`}
                </span>
            )}
        </div>
    );
}
