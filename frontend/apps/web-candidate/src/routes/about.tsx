import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@smart-cv/ui'
import { Award, ShieldCheck, Zap, Sparkles } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'
import { useCandidateStore } from '../store/useCandidateStore'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  const { t } = useTranslation()
  const { count } = useCandidateStore()

  React.useEffect(() => {
    document.title = t('page_title_about')
  }, [t])

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: t('about_feature_apply_title'),
      desc: t('about_feature_apply_desc'),
    },
    {
      icon: <Award className="h-6 w-6 text-primary" />,
      title: t('about_feature_ai_title'),
      desc: t('about_feature_ai_desc'),
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: t('about_feature_security_title'),
      desc: t('about_feature_security_desc'),
    },
  ]

  return (
    <div className="space-y-10 text-left max-w-3xl mx-auto">
      <div className="space-y-4">
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 px-3 py-1">
          <Sparkles className="h-3 w-3" />
          {t('about_badge')}
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">{t('about_title')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('about_subtitle')}
        </p>
      </div>

      {/* Proof of persistent Zustand state */}
      <Card className="bg-primary/5 border-primary/20 shadow-none">
        <CardContent className="p-6 space-y-2">
          <h3 className="font-bold text-lg text-primary flex items-center gap-2">
            {t('about_zustand_title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('about_zustand_desc')}
          </p>
          <div className="text-sm font-semibold text-foreground pt-1">
            {t('about_zustand_count', { count })}
          </div>
        </CardContent>
      </Card>

      {/* Platform Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {features.map((feat, index) => (
          <Card key={index} className="bg-card border-border hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="p-2 w-fit bg-primary/10 rounded-xl mb-2">
                {feat.icon}
              </div>
              <CardTitle className="text-base font-bold">{feat.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              {feat.desc}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation CTA */}
      <div className="pt-6 flex justify-center">
        <Link to="/">
          <Button size="lg" className="px-8 font-semibold shadow-md shadow-primary/20">
            {t('about_back_to_jobs')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
