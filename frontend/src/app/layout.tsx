import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Mini Operations ERP',
  description: 'Production-quality Mini Operations ERP application with real-time inventory control.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
