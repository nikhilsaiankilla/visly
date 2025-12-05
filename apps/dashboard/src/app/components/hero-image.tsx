"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function HeroImage() {
    return (
        <motion.div
            className="relative w-full h-full perspective-distant transform-3d"
        >
            {/* <Image
                src={'/visly.png'}
                width={1200}
                height={800}
                alt="Hero Dashboard"
                unoptimized
                className="w-full absolute inset-0 h-full object-contain rounded-lg shadow-lg opacity-20"
            /> */}

            <Image
                src={'https://agencyanalytics.com/_next/image?url=https%3A%2F%2Fimages.ctfassets.net%2Fdfcvkz6j859j%2F7McL2aU0HzwMtrwuJp03JB%2Fa0340f76a7b32c86e572f2bfecfa352c%2FGoogle-Analytics-4-Dashboard-Example.png&w=3840&q=75'}
                width={1200}
                height={800}
                alt="Hero Dashboard"
                unoptimized
                className="w-full absolute inset-0 h-full object-fill rounded-lg shadow-lg z-10 mask-r-from-50% mask-b-from-70%"
                style={{
                    transform : 'rotateX(20deg) rotateY(20deg) rotateZ(-20deg)'
                }}
            />
        </motion.div>
    );
}