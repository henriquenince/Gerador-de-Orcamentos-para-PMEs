import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gerador de Orçamentos",
  description: "Bot de geração de orçamentos via Telegram",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
