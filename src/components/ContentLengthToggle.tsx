import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentLengthToggleProps {
  value: 'short' | 'medium' | 'long';
  onChange: (value: 'short' | 'medium' | 'long') => void;
}

export function ContentLengthToggle({ value, onChange }: ContentLengthToggleProps) {
  const { t } = useLanguage();

  const options = [
    { key: 'short' as const, label: t('generator.short') },
    { key: 'medium' as const, label: t('generator.medium') },
    { key: 'long' as const, label: t('generator.long') },
  ];

  return (
    <div className="flex rounded-xl bg-secondary p-1">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            value === option.key
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
