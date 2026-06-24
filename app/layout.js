import './globals.css';

export const metadata = {
  title: 'Homework-Breaker | Your AI Assignment Agent',
  description: 'An intelligent web-based agent application to help college students complete assignments with tailored workflows.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="app-container">
          {children}
        </main>
      </body>
    </html>
  );
}
