import { Moon, Sun, History, LogOut, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { logout, user, isGeminiMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">A</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gradient">Adcreative Myanmar</h1>
              <p className="text-xs text-muted-foreground">AI Content Generator</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(user || isGeminiMode) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/archives')}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{t('header.archives')}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'en' ? 'my' : 'en')}
            title={t('header.language')}
          >
            <Globe className="h-4 w-4" />
            <span className="ml-1 text-xs">{language.toUpperCase()}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={t('header.theme')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {(user || isGeminiMode) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('header.logout')}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
