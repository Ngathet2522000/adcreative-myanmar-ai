import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Generation {
  id: string;
  topic: string;
  tone: string;
  generated_content: string;
  created_at: string;
}

export default function Archives() {
  const { t } = useLanguage();
  const { user, isGeminiMode } = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !isGeminiMode) {
      navigate('/');
      return;
    }

    if (user) {
      fetchGenerations();
    } else {
      setLoading(false);
    }
  }, [user, isGeminiMode, navigate]);

  const fetchGenerations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGenerations(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGenerations(prev => prev.filter(g => g.id !== id));
      toast.success(t('common.success'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('common.error'));
    }
  };

  const toneEmojis: Record<string, string> = {
    friendly: '😊',
    informative: 'ℹ️',
    persuasive: '📢',
    technical: '🔧',
    storytelling: '📖',
    descriptive: '🎨',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/generator')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-gradient">{t('archives.title')}</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Archives are only available for registered users
            </p>
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t('archives.empty')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{gen.topic}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">{toneEmojis[gen.tone] || '📝'}</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {gen.tone}
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(gen.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(gen.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {gen.generated_content}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(gen.generated_content);
                    toast.success(t('generator.copied'));
                  }}
                >
                  {t('generator.copy')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
