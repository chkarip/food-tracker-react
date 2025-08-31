import React from 'react';
import GenericCard from '../shared/cards/GenericCard';
import { GenericCardProps } from '../shared/cards/types';

interface SummaryCardProps extends Omit<GenericCardProps, 'variant'> {
  metricName: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  target?: number;
  onViewDetails?: () => void;
  onSetTarget?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  metricName,
  value,
  unit = '',
  change,
  changeLabel,
  trend = 'neutral',
  target,
  onViewDetails,
  onSetTarget,
  ...props
}) => {
  const actions = [];

  if (onViewDetails) {
    actions.push({
      id: 'details',
      label: 'Details',
      icon: 'Details',
      onClick: onViewDetails,
      color: 'primary' as const,
      variant: 'outlined' as const,
    });
  }

  if (onSetTarget) {
    actions.push({
      id: 'target',
      label: 'Set Target',
      icon: 'Set Target',
      onClick: onSetTarget,
      color: 'secondary' as const,
      variant: 'outlined' as const,
    });
  }

  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  const trendColor = trend === 'up' ? 'var(--accent-green, #10b981)' :
                     trend === 'down' ? 'var(--accent-orange, #ff9800)' :
                     'var(--text-secondary, #666)';

  const changeDisplay = change !== undefined ? (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginTop: '4px',
      fontSize: '0.8rem',
      color: trendColor,
      fontWeight: 600
    }}>
      <span style={{ marginRight: '4px' }}>{trendIcon}</span>
      <span>{change > 0 ? '+' : ''}{change}{changeLabel || ''}</span>
    </div>
  ) : null;

  const progressDisplay = target !== undefined ? (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        width: '100%',
        height: '6px',
        background: 'linear-gradient(135deg, var(--card-border, rgba(0,0,0,0.12)) 0%, var(--card-border-light, rgba(0,0,0,0.08)) 100%)',
        borderRadius: '3px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: `${Math.min((Number(value) / target) * 100, 100)}%`,
          height: '100%',
          background: 'linear-gradient(135deg, var(--accent-green, #10b981) 0%, var(--accent-green-light, #34d399) 100%)',
          transition: 'width 0.3s ease',
          borderRadius: '3px'
        }} />
      </div>
      <div style={{
        marginTop: '6px',
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
        textAlign: 'center',
        fontWeight: 600,
        opacity: 0.9
      }}>
        {value}/{target} {unit}
      </div>
    </div>
  ) : null;

  return (
    <GenericCard
      {...props}
      variant="summary"
      title={metricName}
      content={
        <div>
          <div style={{
            fontSize: '2.2rem',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '4px',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {value}{unit}
          </div>
          {changeDisplay}
          {progressDisplay}
        </div>
      }
      actions={actions}
    />
  );
};

export default SummaryCard;
