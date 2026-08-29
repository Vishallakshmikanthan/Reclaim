import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RECLAIM | Revenue Recovery",
  description: "Autonomous Revenue Recovery Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let isDark = localStorage.getItem('theme') === 'dark';
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-slate-50 dark:bg-canvas text-slate-900 dark:text-slate-50 antialiased`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
