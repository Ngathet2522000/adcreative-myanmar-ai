import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Crown, User } from 'lucide-react';

interface QuotaDisplayProps {
  userId: string | null;
  geminiApiKey: string | null;
  refreshKey?: number;
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function QuotaDisplay({ userId, geminiApiKey, refreshKey = 0 }: QuotaDisplayProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(5);

  useEffect(() => {
    const fetchQuota = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch limits from settings
        const { data: settings } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['free_daily_limit', 'premium_daily_limit']);

        const freeLimit = parseInt(settings?.find(s => s.key === 'free_daily_limit')?.value || '5');
        const premiumLimit = parseInt(settings?.find(s => s.key === 'premium_daily_limit')?.value || '100');

        let userIsPremium = false;
        let currentUsage = 0;

        if (userId) {
          // Access key user - fetch from users table
          const { data: userData } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', userId)
            .maybeSingle();

          userIsPremium = userData?.is_premium || false;

          // Get usage
          const { data: usageData } = await supabase
            .from('daily_usage')
            .select('generation_count')
            .eq('usage_date', today)
            .eq('user_id', userId)
            .maybeSingle();

          currentUsage = usageData?.generation_count || 0;
        } else if (geminiApiKey) {
          // Gemini mode user
          const apiKeyHash = await hashApiKey(geminiApiKey);

          // Check if session exists and get premium status
          const { data: sessionData } = await supabase
            .from('gemini_sessions')
            .select('id, is_premium')
            .eq('gemini_api_key', geminiApiKey)
            .maybeSingle();

          userIsPremium = sessionData?.is_premium || false;

          // Get usage by api_key_hash
          const { data: usageData } = await supabase
            .from('daily_usage')
            .select('generation_count')
            .eq('usage_date', today)
            .eq('api_key_hash', apiKeyHash)
            .maybeSingle();

          currentUsage = usageData?.generation_count || 0;
        }

        setIsPremium(userIsPremium);
        setDailyLimit(userIsPremium ? premiumLimit : freeLimit);
        setUsageCount(currentUsage);
      } catch (error) {
        console.error('Error fetching quota:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
  }, [userId, geminiApiKey, refreshKey]);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-4 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{t('common.loading')}</span>
      </div>
    );
  }

  const remaining = Math.max(0, dailyLimit - usageCount);
  const progressValue = dailyLimit > 0 ? (remaining / dailyLimit) * 100 : 0;
  const isExhausted = remaining === 0;

  // Color based on remaining percentage
  const getProgressColor = () => {
    if (progressValue > 50) return 'bg-green-500';
    if (progressValue > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t('generator.quotaTitle')}
          </span>
          <Badge 
            variant={isPremium ? "default" : "secondary"}
            className={isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0" : ""}
          >
            {isPremium ? (
              <>
                <Crown className="h-3 w-3 mr-1" />
                {t('generator.tierPremium')}
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                {t('generator.tierFree')}
              </>
            )}
          </Badge>
        </div>
        <span className={`text-sm font-medium ${isExhausted ? 'text-destructive' : 'text-foreground'}`}>
          {remaining} / {dailyLimit}
        </span>
      </div>
      
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div 
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${progressValue}%` }}
        />
      </div>
      
      <p className={`text-xs mt-2 ${isExhausted ? 'text-destructive' : 'text-muted-foreground'}`}>
        {isExhausted 
          ? t('generator.quotaExhausted')
          : t('generator.quotaRemaining').replace('{remaining}', String(remaining)).replace('{limit}', String(dailyLimit))
        }
      </p>
    </div>
  );
}
