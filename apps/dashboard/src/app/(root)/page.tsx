"use client";

import { SessionProvider } from "next-auth/react";
import Hero from "../components/hero";
import Nav from "../components/Nav";

export default function Home() {
  return (
    <SessionProvider>
      <main>
        <Nav />
        <Hero />
      </main>
    </SessionProvider>
  );
}

