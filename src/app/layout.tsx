import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "FlipFinderAI",
  description: "AI powered property deal finder",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (

    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >


      <body className="min-h-full flex flex-col bg-gray-100">



        <nav className="
          bg-black
          text-white
          px-6
          py-4
          flex
          justify-between
          items-center
        ">


          <Link
            href="/"
            className="text-xl font-bold"
          >
            🏠 FlipFinderAI
          </Link>



          <div className="flex gap-5">


            <Link
              href="/"
              className="hover:text-gray-300"
            >
              Properties
            </Link>


            <Link
              href="/import"
              className="hover:text-gray-300"
            >
              Import
            </Link>


          </div>


        </nav>



        {children}



      </body>


    </html>

  );

}