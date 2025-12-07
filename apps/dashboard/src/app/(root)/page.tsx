"use client";

import { SessionProvider, useSession } from "next-auth/react";
import Hero from "../components/hero";
import Nav from "../components/Nav";
import Footer from "../components/footer";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [])

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

