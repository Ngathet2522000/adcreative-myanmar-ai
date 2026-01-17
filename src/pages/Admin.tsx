import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Users, Key, Settings, Copy, Trash2, Plus, Save, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface User {
  id: string;
  label: string;
  access_key: string;
  gemini_api_key: string | null;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
}

interface SystemKey {
  id: string;
  api_key: string;
  label: string | null;
  is_active: boolean;
  usage_count: number;
}

interface GeminiSession {
  id: string;
  gemini_api_key: string;
  label: string;
  is_converted_to_system_key: boolean;
  is_premium: boolean;
  created_at: string;
  last_used_at: string;
  usage_count: number;
}

export default function Admin() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [systemKeys, setSystemKeys] = useState<SystemKey[]>([]);
  const [geminiSessions, setGeminiSessions] = useState<GeminiSession[]>([]);

  const [newUserLabel, setNewUserLabel] = useState('');
  const [newUserGeminiKey, setNewUserGeminiKey] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyApiKey, setNewKeyApiKey] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [freeDailyLimit, setFreeDailyLimit] = useState('5');
  const [premiumDailyLimit, setPremiumDailyLimit] = useState('100');
  const [savingSettings, setSavingSettings] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'admin_password')
        .maybeSingle();

      if (error) throw error;

      if (data?.value === password) {
        setAuthenticated(true);
        fetchData();
      } else {
        toast.error('Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [usersRes, keysRes, settingsRes, geminiRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('system_keys').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
        supabase.from('gemini_sessions').select('*').order('last_used_at', { ascending: false }),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (keysRes.data) setSystemKeys(keysRes.data);
      if (geminiRes.data) setGeminiSessions(geminiRes.data);
      if (settingsRes.data) {
        const proxyUrlSetting = settingsRes.data.find(s => s.key === 'proxy_base_url');
        if (proxyUrlSetting) setProxyUrl(proxyUrlSetting.value);
        const freeLimitSetting = settingsRes.data.find(s => s.key === 'free_daily_limit');
        if (freeLimitSetting) setFreeDailyLimit(freeLimitSetting.value);
        const premiumLimitSetting = settingsRes.data.find(s => s.key === 'premium_daily_limit');
        if (premiumLimitSetting) setPremiumDailyLimit(premiumLimitSetting.value);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const generateAccessKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'ADC-';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) key += '-';
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserLabel.trim()) return;

    setCreatingUser(true);
    try {
      const accessKey = generateAccessKey();
      const { error } = await supabase.from('users').insert({
        label: newUserLabel.trim(),
        access_key: accessKey,
        gemini_api_key: newUserGeminiKey.trim() || null,
      });

      if (error) throw error;

      toast.success('User created!');
      setNewUserLabel('');
      setNewUserGeminiKey('');
      fetchData();
    } catch (error) {
      console.error('Create error:', error);
      toast.error(t('common.error'));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleCreateSystemKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyApiKey.trim()) return;

    setCreatingKey(true);
    try {
      const { error } = await supabase.from('system_keys').insert({
        label: newKeyLabel.trim() || null,
        api_key: newKeyApiKey.trim(),
      });

      if (error) throw error;

      toast.success('System key added!');
      setNewKeyLabel('');
      setNewKeyApiKey('');
      fetchData();
    } catch (error) {
      console.error('Create error:', error);
      toast.error(t('common.error'));
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteSystemKey = async (id: string) => {
    try {
      const { error } = await supabase.from('system_keys').delete().eq('id', id);
      if (error) throw error;
      setSystemKeys(prev => prev.filter(k => k.id !== id));
      toast.success('System key deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleAddToSystemKeys = async (session: GeminiSession) => {
    try {
      // Add to system keys
      const { error: insertError } = await supabase.from('system_keys').insert({
        label: `User Key - ${format(new Date(session.created_at), 'MMM d')}`,
        api_key: session.gemini_api_key,
      });

      if (insertError) throw insertError;

      // Mark as converted
      await supabase
        .from('gemini_sessions')
        .update({ is_converted_to_system_key: true })
        .eq('id', session.id);

      toast.success('Added to system keys!');
      fetchData();
    } catch (error) {
      console.error('Add to system error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleDeleteGeminiSession = async (id: string) => {
    try {
      const { error } = await supabase.from('gemini_sessions').delete().eq('id', id);
      if (error) throw error;
      setGeminiSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const updates = [];

      if (newPassword.trim()) {
        updates.push(
          supabase
            .from('settings')
            .update({ value: newPassword.trim() })
            .eq('key', 'admin_password')
        );
      }

      updates.push(
        supabase
          .from('settings')
          .update({ value: proxyUrl.trim() })
          .eq('key', 'proxy_base_url')
      );

      updates.push(
        supabase
          .from('settings')
          .update({ value: freeDailyLimit.trim() })
          .eq('key', 'free_daily_limit')
      );

      updates.push(
        supabase
          .from('settings')
          .update({ value: premiumDailyLimit.trim() })
          .eq('key', 'premium_daily_limit')
      );

      await Promise.all(updates);
      toast.success('Settings saved!');
      setNewPassword('');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('common.error'));
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('admin.title')}</h1>
          </div>

          <form onSubmit={handleLogin} className="glass-card rounded-2xl p-4 sm:p-6">
            <Label htmlFor="password">{t('admin.password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('admin.passwordPlaceholder')}
              className="mt-2"
            />
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={loading || !password.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin.enter')}
            </Button>
          </form>

          <div className="text-center mt-4 sm:mt-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('admin.back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8 sm:h-9 sm:w-9">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="font-bold text-sm sm:text-lg">{t('admin.title')}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAuthenticated(false)} className="text-xs sm:text-sm">
            {t('admin.logout')}
          </Button>
        </div>
      </header>

      <main className="container py-4 sm:py-8 px-3 sm:px-4 max-w-4xl">
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-4 mb-6 sm:mb-8 h-auto">
            <TabsTrigger value="users" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('admin.users')}</span>
            </TabsTrigger>
            <TabsTrigger value="userKeys" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('admin.userGeminiKeys')}</span>
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">
              <Key className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('admin.systemKeys')}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('admin.settings')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <form onSubmit={handleCreateUser} className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t('admin.addUser')}</h3>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="userLabel" className="text-xs sm:text-sm">{t('admin.userLabel')}</Label>
                  <Input
                    id="userLabel"
                    value={newUserLabel}
                    onChange={(e) => setNewUserLabel(e.target.value)}
                    placeholder={t('admin.userLabelPlaceholder')}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="userGeminiKey" className="text-xs sm:text-sm">{t('admin.geminiKey')}</Label>
                  <Input
                    id="userGeminiKey"
                    value={newUserGeminiKey}
                    onChange={(e) => setNewUserGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="mt-3 sm:mt-4 text-xs sm:text-sm"
                disabled={creatingUser || !newUserLabel.trim()}
              >
                {creatingUser && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t('admin.create')}
              </Button>
            </form>

            <div className="space-y-3 sm:space-y-4">
              {users.map((user) => (
                <div key={user.id} className="glass-card rounded-xl p-3 sm:p-4">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm sm:text-base truncate">{user.label}</h4>
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${user.is_premium ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {user.is_premium ? t('admin.tierPremium') : t('admin.tierFree')}
                        </span>
                      </div>
                      <code className="text-[10px] sm:text-xs text-muted-foreground break-all">{user.access_key}</code>
                    </div>
                    <div className="flex gap-1 sm:gap-2 shrink-0">
                      <Button
                        variant={user.is_premium ? "secondary" : "outline"}
                        size="sm"
                        onClick={async () => {
                          await supabase.from('users').update({ is_premium: !user.is_premium }).eq('id', user.id);
                          fetchData();
                          toast.success(user.is_premium ? 'Set to Free tier' : 'Set to Premium tier');
                        }}
                        className="h-7 sm:h-8 px-2 text-xs"
                      >
                        {user.is_premium ? t('admin.setAsFree') : t('admin.setAsPremium')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(user.access_key)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* User Gemini Keys Tab */}
          <TabsContent value="userKeys" className="space-y-4 sm:space-y-6">
            <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base mb-2">{t('admin.userGeminiKeys')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                These are Gemini API keys provided by users who logged in with "Start with Gemini"
              </p>
            </div>

            {geminiSessions.length === 0 ? (
              <div className="text-center py-10 sm:py-20">
                <p className="text-sm text-muted-foreground">{t('admin.noUserKeys')}</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {geminiSessions.map((session) => (
                  <div key={session.id} className="glass-card rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs sm:text-sm text-foreground font-mono">
                            {session.gemini_api_key.slice(0, 10)}...{session.gemini_api_key.slice(-4)}
                          </code>
                          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${session.is_premium ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {session.is_premium ? t('admin.tierPremium') : t('admin.tierFree')}
                          </span>
                          {session.is_converted_to_system_key && (
                            <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              In System
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[10px] sm:text-xs bg-secondary/50 px-1.5 py-0.5 rounded">
                            {session.usage_count} uses
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {t('admin.lastUsed')}: {format(new Date(session.last_used_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 shrink-0">
                        <Button
                          variant={session.is_premium ? "secondary" : "outline"}
                          size="sm"
                          onClick={async () => {
                            await supabase.from('gemini_sessions').update({ is_premium: !session.is_premium }).eq('id', session.id);
                            fetchData();
                            toast.success(session.is_premium ? 'Set to Free tier' : 'Set to Premium tier');
                          }}
                          className="h-7 sm:h-8 px-2 text-xs"
                        >
                          {session.is_premium ? t('admin.setAsFree') : t('admin.setAsPremium')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(session.gemini_api_key)}
                          className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                        >
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Copy</span>
                        </Button>
                        {!session.is_converted_to_system_key && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddToSystemKeys(session)}
                            className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">{t('admin.addToSystemKeys')}</span>
                            <span className="sm:hidden">Add</span>
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteGeminiSession(session.id)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* System Keys Tab */}
          <TabsContent value="keys" className="space-y-4 sm:space-y-6">
            <form onSubmit={handleCreateSystemKey} className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t('admin.addSystemKey')}</h3>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="keyLabel" className="text-xs sm:text-sm">{t('admin.keyLabel')}</Label>
                  <Input
                    id="keyLabel"
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    placeholder="Backup Key 1"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey" className="text-xs sm:text-sm">{t('admin.apiKey')}</Label>
                  <Input
                    id="apiKey"
                    value={newKeyApiKey}
                    onChange={(e) => setNewKeyApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="mt-3 sm:mt-4 text-xs sm:text-sm"
                disabled={creatingKey || !newKeyApiKey.trim()}
              >
                {creatingKey && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t('admin.create')}
              </Button>
            </form>

            <div className="space-y-3 sm:space-y-4">
              {systemKeys.map((key) => (
                <div key={key.id} className="glass-card rounded-xl p-3 sm:p-4">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm sm:text-base">{key.label || 'Unnamed Key'}</h4>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                        <code className="text-[10px] sm:text-xs text-muted-foreground">
                          {key.api_key.slice(0, 10)}...{key.api_key.slice(-4)}
                        </code>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          ({key.usage_count} uses)
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSystemKey(key.id)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <form onSubmit={handleSaveSettings} className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="newPassword" className="text-xs sm:text-sm">{t('admin.changePassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('admin.newPassword')}
                  className="mt-1 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="freeDailyLimit" className="text-xs sm:text-sm">{t('admin.freeDailyLimit')}</Label>
                  <Input
                    id="freeDailyLimit"
                    type="number"
                    min="1"
                    max="1000"
                    value={freeDailyLimit}
                    onChange={(e) => setFreeDailyLimit(e.target.value)}
                    placeholder="5"
                    className="mt-1 text-sm"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {t('admin.freeDailyLimitDesc')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="premiumDailyLimit" className="text-xs sm:text-sm">{t('admin.premiumDailyLimit')}</Label>
                  <Input
                    id="premiumDailyLimit"
                    type="number"
                    min="1"
                    max="1000"
                    value={premiumDailyLimit}
                    onChange={(e) => setPremiumDailyLimit(e.target.value)}
                    placeholder="100"
                    className="mt-1 text-sm"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {t('admin.premiumDailyLimitDesc')}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="proxyUrl" className="text-xs sm:text-sm">{t('admin.proxyUrl')}</Label>
                <Input
                  id="proxyUrl"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="https://proxy.example.com"
                  className="mt-1 text-sm"
                />
              </div>

              <Button type="submit" disabled={savingSettings} className="text-xs sm:text-sm">
                {savingSettings && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Save Settings
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
