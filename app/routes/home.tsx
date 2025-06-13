import { Navbar } from "~/components/navbar";
import { Hero } from "~/components/hero";
import { Preview } from "~/components/preview";
import { Feature } from "~/components/feature";
import { CTA } from "~/components/actions";
import { Footer } from "~/components/footer";

export function meta() {
  return [
    { title: import.meta.env.VITE_APP_NAME },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-stone-800 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Animated rainbow background gradients */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 right-20 w-48 h-48 bg-gradient-to-r from-cyan-500 via-teal-500 to-green-500 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-20 w-52 h-52 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <Navbar />
      <Hero />
      <Preview />
      <Feature />
      <CTA />
      <Footer />
    </div>
  );
}
