import { useState } from 'react';
import { Copy, Check, Save, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneratedContentProps {
  content: string;
  topic: string;
  keywords: string;
  additionalContext: string;
  contentLength: string;
  tone: string;
  onReset?: () => void;
}

export function GeneratedContent({
  content,
  topic,
  keywords,
  additionalContext,
  contentLength,
  tone,
  onReset,
}: GeneratedContentProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success(t('generator.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Login required to save');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('generations').insert({
        user_id: user.id,
        topic,
        keywords,
        additional_context: additionalContext,
        content_length: contentLength,
        tone,
        generated_content: content,
      });

      if (error) throw error;

      setSaved(true);
      toast.success(t('generator.saved'));
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-xl bg-card border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-base sm:text-lg">{t('generator.result')}</h3>
        <div className="flex gap-2 flex-wrap">
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('generator.generateNew')}</span>
              <span className="xs:hidden">New</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
          >
            {copied ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden xs:inline">{copied ? t('generator.copied') : t('generator.copy')}</span>
            <span className="xs:hidden">{copied ? '✓' : 'Copy'}</span>
          </Button>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving || saved}
              className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden xs:inline">{saved ? t('generator.saved') : t('generator.save')}</span>
              <span className="xs:hidden">{saved ? '✓' : 'Save'}</span>
            </Button>
          )}
        </div>
      </div>
      <div className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}
