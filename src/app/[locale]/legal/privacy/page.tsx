import type { Metadata } from "next";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/layout/site-shell";
import { Alert } from "@/components/ui/feedback";
import { brand } from "@/config/brand";
import { getDictionary, getLocale } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.legal.privacyMetaTitle };
}

/**
 * Maxfiylik siyosati (dastlabki versiya). Faqat tizim haqiqatan qiladigan ishlar yozilgan.
 * Ishga tushirishdan oldin huquqshunos tekshiradi va operator rekvizitlari qo‘shiladi.
 */
export default async function PrivacyPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const { legal } = dict;

  return (
    <>
      <SkipLink label={dict.nav.skipToContent} />
      <SiteHeader locale={locale} languageLabel={dict.nav.language} />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <h1 className="font-display text-4xl font-semibold">{legal.privacyTitle}</h1>
        <Alert tone="warning" title={legal.draftNotice} className="mt-6" />
        <div className="mt-8 flex flex-col gap-8">
          {legal.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="bg-gold mt-2.5 size-1.5 shrink-0 rounded-full"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter copyright={interpolate(dict.footer.copyright, { brand: brand.name })} />
    </>
  );
}
