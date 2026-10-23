import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  image?: string;
  type?: string;
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const SITE_URL = 'https://vstudyonline.srrsolutions.io';

const ensureMetaTag = (attribute: 'name' | 'property', key: string, value: string) => {
  if (!value) return;

  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', value);
};

const setCanonical = (canonical: string) => {
  let tag = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }

  tag.setAttribute('href', canonical);
};

const clearJsonLd = () => {
  document.querySelectorAll('script[data-seo-jsonld="true"]').forEach((node) => node.remove());
};

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'VStudyOnline — Learn Without Limits, Shape Your Future | SRR Solutions',
  description = 'VStudyOnline by SRR Solutions is the premier online learning ecosystem offering career-defining courses, live interactive masterclasses, CRM-backed mentorship, and verifiable industry skills.',
  canonical,
  keywords = 'VStudyOnline, SRR Solutions, online courses, EdTech CRM, live masterclasses, career certifications, skill training',
  image = '/Images/logo.png',
  type = 'website',
  schema,
}) => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname || '/';
    const resolvedCanonical = canonical || `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
    const resolvedImage = image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`;

    document.title = title;
    ensureMetaTag('name', 'title', title);
    ensureMetaTag('name', 'description', description);
    ensureMetaTag('name', 'keywords', keywords);
    ensureMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    ensureMetaTag('property', 'og:type', type);
    ensureMetaTag('property', 'og:url', resolvedCanonical);
    ensureMetaTag('property', 'og:title', title);
    ensureMetaTag('property', 'og:description', description);
    ensureMetaTag('property', 'og:image', resolvedImage);
    ensureMetaTag('property', 'og:site_name', 'VStudyOnline');

    ensureMetaTag('name', 'twitter:card', 'summary_large_image');
    ensureMetaTag('name', 'twitter:url', resolvedCanonical);
    ensureMetaTag('name', 'twitter:title', title);
    ensureMetaTag('name', 'twitter:description', description);
    ensureMetaTag('name', 'twitter:image', resolvedImage);

    setCanonical(resolvedCanonical);

    if (schema) {
      clearJsonLd();
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      if (schema) {
        clearJsonLd();
      }
    };
  }, [canonical, description, image, keywords, location.pathname, schema, title, type]);

  return null;
};
