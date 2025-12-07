"use client";

import { SessionProvider } from "next-auth/react";
import Hero from "../components/hero";
import Nav from "../components/Nav";
import Footer from "../components/footer";

export default function Home() {
  return (
    <SessionProvider>
      <main>
        <Nav />
        <Hero />
        <Footer />
      </main>
    </SessionProvider>
  );
}

