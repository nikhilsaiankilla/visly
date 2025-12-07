import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

const CtaSection = () => (
    <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-green-600 mb-6">
                Stop guessing. Start tracking.
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                Create your free project today and get your unique Project ID immediately. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={'/login'}>
                    <Button className="h-12 px-8 text-base cursor-pointer group bg-green-600 text-white hover:bg-green-600/90">
                        Get your project id
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </div>
        </div>
    </section>
);

export default CtaSection