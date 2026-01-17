import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { ToneCard } from '@/components/ToneCard';
import { ContentLengthToggle } from '@/components/ContentLengthToggle';
import { ImageUpload } from '@/components/ImageUpload';
import { GeneratedContent } from '@/components/GeneratedContent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const tones = [
  { key: 'friendly', icon: '😊' },
  { key: 'informative', icon: 'ℹ️' },
  { key: 'persuasive', icon: '📢' },
  { key: 'technical', icon: '🔧' },
  { key: 'storytelling', icon: '📖' },
  { key: 'descriptive', icon: '🎨' },
];

export default function Generator() {
  const { t } = useLanguage();
  const { user, isGeminiMode, geminiApiKey, logout } = useAuth();
  const navigate = useNavigate();

  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [contentLength, setContentLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [selectedTone, setSelectedTone] = useState('friendly');
  const [image, setImage] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  useEffect(() => {
    if (!user && !isGeminiMode) {
      navigate('/');
    }
  }, [user, isGeminiMode, navigate]);

  const resetForm = () => {
    setTopic('');
    setKeywords('');
    setAdditionalContext('');
    setContentLength('medium');
    setSelectedTone('friendly');
    setImage(null);
    setGeneratedContent('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    setGeneratedContent('');

    try {
      // Convert image to base64 if provided
      let imageBase64 = null;
      if (image) {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(image);
        });
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          topic,
          keywords,
          additionalContext,
          contentLength,
          tone: selectedTone,
          imageBase64,
          useGemini: isGeminiMode,
          geminiApiKey: isGeminiMode ? geminiApiKey : user?.geminiApiKey,
        },
      });

      if (error) throw error;

      if (data?.content) {
        setGeneratedContent(data.content);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error?.message || t('common.error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gradient">{t('generator.title')}</h2>
          {user && (
            <p className="text-sm text-muted-foreground mt-1">
              Welcome, {user.label}
            </p>
          )}
          {isGeminiMode && (
            <p className="text-sm text-muted-foreground mt-1">
              Using your Gemini API Key
            </p>
          )}
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Topic */}
          <div className="glass-card rounded-2xl p-6">
            <Label htmlFor="topic" className="text-sm font-medium">
              {t('generator.topic')} *
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('generator.topicPlaceholder')}
              className="mt-2"
              required
            />
          </div>

          {/* Keywords */}
          <div className="glass-card rounded-2xl p-6">
            <Label htmlFor="keywords" className="text-sm font-medium">
              {t('generator.keywords')}
            </Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={t('generator.keywordsPlaceholder')}
              className="mt-2"
            />
          </div>

          {/* Additional Context */}
          <div className="glass-card rounded-2xl p-6">
            <Label htmlFor="context" className="text-sm font-medium">
              {t('generator.context')}
            </Label>
            <Textarea
              id="context"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder={t('generator.contextPlaceholder')}
              className="mt-2 min-h-[100px]"
            />
          </div>

          {/* Content Length */}
          <div className="glass-card rounded-2xl p-6">
            <Label className="text-sm font-medium mb-3 block">
              {t('generator.contentLength')}
            </Label>
            <ContentLengthToggle value={contentLength} onChange={setContentLength} />
          </div>

          {/* Visual Reference */}
          <div className="glass-card rounded-2xl p-6">
            <Label className="text-sm font-medium mb-3 block">
              {t('generator.visualRef')}
            </Label>
            <ImageUpload value={image} onChange={setImage} />
          </div>

          {/* Tone Selection */}
          <div className="glass-card rounded-2xl p-6">
            <Label className="text-sm font-medium mb-4 block">
              {t('generator.selectTone')}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tones.map((tone) => (
                <ToneCard
                  key={tone.key}
                  tone={tone.key}
                  icon={tone.icon}
                  selected={selectedTone === tone.key}
                  onClick={() => setSelectedTone(tone.key)}
                />
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg gradient-primary text-primary-foreground glow-primary"
            disabled={generating || !topic.trim()}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('generator.generating')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {t('generator.generate')}
              </>
            )}
          </Button>
        </form>

        {/* Generated Content */}
        {generatedContent && (
          <GeneratedContent
            content={generatedContent}
            topic={topic}
            keywords={keywords}
            additionalContext={additionalContext}
            contentLength={contentLength}
            tone={selectedTone}
            onReset={resetForm}
          />
        )}
      </main>
    </div>
  );
}
