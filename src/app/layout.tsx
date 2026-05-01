import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreshFlow — Laundry Management",
  description: "Professional laundry business management system",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card-hover)",
            },
            success: {
              iconTheme: { primary: "#14b8a6", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
