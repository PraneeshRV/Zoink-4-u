import { useEffect, useState } from 'react';

interface Props {
  score: number;
  size?: number;
}

export default function ZoinkScoreRing({ score, size = 100 }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const offset = circumference - progress;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = () => {
    if (animatedScore >= 70) return '#22c55e'; // green
    if (animatedScore >= 40) return '#fbbf24'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="zoink-ring-container">
      <div className="zoink-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            className="zoink-ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          <circle
            className="zoink-ring-progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="zoink-ring-value" style={{ color: getColor() }}>
          {animatedScore}
        </div>
      </div>
      <span className="zoink-ring-label">Zoink Score</span>
    </div>
  );
}
