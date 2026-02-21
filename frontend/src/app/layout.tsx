import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scale Management',
  description: 'Dashboard de balanzas por sucursal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
