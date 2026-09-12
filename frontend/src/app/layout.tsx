import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Cyber3DBackground } from '../components/Cyber3DBackground';

export const metadata = {
  title: 'Mini Operations ERP — Cyber Matrix',
  description: 'Production-quality Cyberpunk Operations ERP application with real-time 3D telemetry.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cyber-bg text-slate-100 antialiased selection:bg-cyber-cyan selection:text-black cyber-scanlines font-sans">
        <AuthProvider>
          <Cyber3DBackground />
          <div className="relative z-10">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
