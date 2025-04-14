import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "./_components/Header";
import NextAuthSessionProvider from "./provider";
import { Toaster } from "sonner";

const inter = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "Sahreen Home Service",
  description: "Home Service App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>
        <div className="mx-6 md:mx-16">
          <Header />
          <Toaster/>
          {children}
        </div>
        </NextAuthSessionProvider>
    
      </body>
    </html>
  );
}
