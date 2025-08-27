export const metadata = { title: 'Voxel Next', description: 'Minecraft-like prototype' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body style={{margin:0, padding:0}}>{children}</body>
    </html>
  );
}
