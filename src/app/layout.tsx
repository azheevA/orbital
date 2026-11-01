import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ORBITAL — исследуй Вселенную',
  description: 'Интерактивная цифровая обсерватория: 3D-модель Солнечной системы и каталог звёзд, планет, спутников и галактик.',
  applicationName: 'ORBITAL Explorer',
  keywords: ['астрономия', 'Солнечная система', 'NASA', 'JPL', '3D', 'космос', 'каталог небесных объектов'],
  icons: { icon: '/icon.svg', shortcut: '/icon.svg' },
  openGraph: { title: 'ORBITAL — исследуй Вселенную', description: 'Интерактивная цифровая обсерватория и каталог небесных объектов.', type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#070914',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
