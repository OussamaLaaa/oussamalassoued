import { useEffect } from 'react';

interface SeoMetaOptions {
  title: string;
  description: string;
  canonicalUrl?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  type?: string;
  robots?: string;
}

const setMetaTag = (selector: string, attrName: 'content' | 'href', value: string) => {
  let element = document.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);

  if (!element) {
    element = selector.startsWith('link')
      ? document.createElement('link')
      : document.createElement('meta');

    if (selector.startsWith('link')) {
      (element as HTMLLinkElement).rel = 'canonical';
      document.head.appendChild(element);
    } else {
      document.head.appendChild(element);
    }
  }

  element.setAttribute(attrName, value);
};

const setMetaContent = (selector: string, value: string) => {
  let element = document.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    const propertyMatch = selector.match(/\[(?:property|name)='([^']+)'\]/);
    if (propertyMatch?.[1]) {
      if (selector.includes('property=')) {
        element.setAttribute('property', propertyMatch[1]);
      } else {
        element.setAttribute('name', propertyMatch[1]);
      }
    }
    document.head.appendChild(element);
  }

  element.setAttribute('content', value);
};

export const useSeoMeta = ({
  title,
  description,
  canonicalUrl,
  imageUrl = 'https://www.oussamalassoued.me/og-image.svg',
  imageWidth = 1200,
  imageHeight = 630,
  type = 'website',
  robots = 'index, follow',
}: SeoMetaOptions) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = title;
    setMetaContent("meta[name='description']", description);
    setMetaContent("meta[name='robots']", robots);
    setMetaContent("meta[property='og:type']", type);
    setMetaContent("meta[property='og:title']", title);
    setMetaContent("meta[property='og:description']", description);
    setMetaContent("meta[property='og:image']", imageUrl);
    setMetaContent("meta[property='og:image:width']", String(imageWidth));
    setMetaContent("meta[property='og:image:height']", String(imageHeight));
    setMetaContent("meta[name='twitter:card']", 'summary_large_image');
    setMetaContent("meta[name='twitter:title']", title);
    setMetaContent("meta[name='twitter:description']", description);
    setMetaContent("meta[name='twitter:image']", imageUrl);

    if (canonicalUrl) {
      setMetaTag("link[rel='canonical']", 'href', canonicalUrl);
      setMetaContent("meta[property='og:url']", canonicalUrl);
      setMetaContent("meta[name='twitter:url']", canonicalUrl);
    }
  }, [canonicalUrl, description, imageHeight, imageUrl, imageWidth, robots, title, type]);
};