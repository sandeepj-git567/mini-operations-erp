import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { FuturisticBackground } from '../components/FuturisticBackground';

export const metadata = {
  title: 'Mini Operations ERP — Advanced Matrix',
  description: 'Production-quality Futuristic Operations ERP platform featuring realtime concurrency telemetry.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark-bg text-slate-100 antialiased selection:bg-sky-500 selection:text-black futuristic-mesh-bg futuristic-grid font-sans">
        <AuthProvider>
          <FuturisticBackground />
          <div className="relative z-10">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
