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
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-primary-foreground">A</span>
            </div>
            <div className="hidden xs:block">
              <h1 className="font-bold text-sm sm:text-lg text-gradient">Adcreative Myanmar</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">AI Content Generator</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {(user || isGeminiMode) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/archives')}
              className="gap-1 sm:gap-2 px-2 sm:px-3"
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
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-2"
          >
            <Globe className="h-4 w-4" />
            <span className="ml-1 text-xs hidden sm:inline">{language.toUpperCase()}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={t('header.theme')}
            className="h-8 w-8 sm:h-9 sm:w-9"
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
              className="gap-1 sm:gap-2 px-2 sm:px-3 text-destructive hover:text-destructive"
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
