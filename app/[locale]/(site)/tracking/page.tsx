import { getTranslations } from 'next-intl/server';
import { Container } from '@/app/components/ui/Container';
import { LeadTrackingForm } from '@/app/components/tracking/LeadTrackingForm';

export async function generateMetadata() {
  const t = await getTranslations('tracking');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function TrackingPage() {
  const t = await getTranslations('tracking');

  return (
    <section className="min-h-[50vh] py-8 md:py-12">
      <Container>
        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">{t('pageTitle')}</h1>
          <p className="mt-2 text-slate-600">{t('pageDescription')}</p>
        </div>

        <div className="max-w-2xl">
          <LeadTrackingForm />
        </div>
      </Container>
    </section>
  );
}
