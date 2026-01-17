import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ToneCardProps {
  tone: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}

const toneData: Record<string, { titleKey: string; descKey: string }> = {
  friendly: { titleKey: 'tone.friendly', descKey: 'tone.friendlyDesc' },
  informative: { titleKey: 'tone.informative', descKey: 'tone.informativeDesc' },
  persuasive: { titleKey: 'tone.persuasive', descKey: 'tone.persuasiveDesc' },
  technical: { titleKey: 'tone.technical', descKey: 'tone.technicalDesc' },
  storytelling: { titleKey: 'tone.storytelling', descKey: 'tone.storytellingDesc' },
  descriptive: { titleKey: 'tone.descriptive', descKey: 'tone.descriptiveDesc' },
};

export function ToneCard({ tone, icon, selected, onClick }: ToneCardProps) {
  const { t } = useLanguage();
  const data = toneData[tone] || { titleKey: tone, descKey: '' };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all duration-200',
        'hover:scale-105 hover:shadow-lg',
        selected
          ? 'border-primary bg-primary/10 glow-primary'
          : 'border-border bg-card hover:border-primary/50'
      )}
    >
      <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">{icon}</span>
      <span className={cn(
        'font-semibold text-xs sm:text-sm',
        selected ? 'text-primary' : 'text-foreground'
      )}>
        {t(data.titleKey)}
      </span>
      <span className="text-[10px] sm:text-xs text-muted-foreground text-center mt-0.5 sm:mt-1 line-clamp-2">
        {t(data.descKey)}
      </span>
    </button>
  );
}
