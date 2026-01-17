import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Users, Key, Settings, Copy, Trash2, Plus, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  label: string;
  access_key: string;
  gemini_api_key: string | null;
  is_active: boolean;
  created_at: string;
}

interface SystemKey {
  id: string;
  api_key: string;
  label: string | null;
  is_active: boolean;
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

  const [newUserLabel, setNewUserLabel] = useState('');
  const [newUserGeminiKey, setNewUserGeminiKey] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyApiKey, setNewKeyApiKey] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
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
      const [usersRes, keysRes, settingsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('system_keys').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (keysRes.data) setSystemKeys(keysRes.data);
      if (settingsRes.data) {
        const proxyUrlSetting = settingsRes.data.find(s => s.key === 'proxy_base_url');
        if (proxyUrlSetting) setProxyUrl(proxyUrlSetting.value);
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
          </div>

          <form onSubmit={handleLogin} className="glass-card rounded-2xl p-6">
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

          <div className="text-center mt-6">
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
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">{t('admin.title')}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAuthenticated(false)}>
            {t('admin.logout')}
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t('admin.users')}
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="h-4 w-4" />
              {t('admin.systemKeys')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.settings')}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <form onSubmit={handleCreateUser} className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold mb-4">{t('admin.addUser')}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="userLabel">{t('admin.userLabel')}</Label>
                  <Input
                    id="userLabel"
                    value={newUserLabel}
                    onChange={(e) => setNewUserLabel(e.target.value)}
                    placeholder={t('admin.userLabelPlaceholder')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="userGeminiKey">{t('admin.geminiKey')}</Label>
                  <Input
                    id="userGeminiKey"
                    value={newUserGeminiKey}
                    onChange={(e) => setNewUserGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="mt-4"
                disabled={creatingUser || !newUserLabel.trim()}
              >
                {creatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.create')}
              </Button>
            </form>

            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{user.label}</h4>
                      <code className="text-xs text-muted-foreground">{user.access_key}</code>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(user.access_key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* System Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            <form onSubmit={handleCreateSystemKey} className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold mb-4">{t('admin.addSystemKey')}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="keyLabel">{t('admin.keyLabel')}</Label>
                  <Input
                    id="keyLabel"
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    placeholder="Backup Key 1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">{t('admin.apiKey')}</Label>
                  <Input
                    id="apiKey"
                    value={newKeyApiKey}
                    onChange={(e) => setNewKeyApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="mt-4"
                disabled={creatingKey || !newKeyApiKey.trim()}
              >
                {creatingKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.create')}
              </Button>
            </form>

            <div className="space-y-4">
              {systemKeys.map((key) => (
                <div key={key.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{key.label || 'Unnamed Key'}</h4>
                      <code className="text-xs text-muted-foreground">
                        {key.api_key.slice(0, 10)}...{key.api_key.slice(-4)}
                      </code>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({key.usage_count} uses)
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSystemKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <form onSubmit={handleSaveSettings} className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <Label htmlFor="newPassword">{t('admin.changePassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('admin.newPassword')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="proxyUrl">{t('admin.proxyUrl')}</Label>
                <Input
                  id="proxyUrl"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="https://proxy.example.com"
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={savingSettings}>
                {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
