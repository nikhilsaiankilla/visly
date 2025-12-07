"use client"

import Image from "next/image";
import { motion } from "framer-motion";

const LandingImages = () => {
    return (
        <div className="w-full max-w-5xl mx-auto relative aspect-square h-full mt-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, 15, 0]
                }}
                transition={{
                    opacity: { duration: 1, delay: 0.2 },
                    scale: { duration: 1, delay: 0.2 },
                }}
            >
                <Image
                    src={'/landing-2.png'}
                    alt="Landing analytics image"
                    width={100}
                    unoptimized
                    height={100}
                    className="w-full aspect-square shadow-2xl rounded-2xl absolute inset-5 md:inset-20"
                />
            </motion.div>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, 15, 0] // Floating animation loop
                }}
                transition={{
                    // Entrance transition
                    opacity: { duration: 1, delay: 0.2 },
                    scale: { duration: 1, delay: 0.2 },
                }}
            >
                <Image
                    src={'/landing.png'}
                    alt="Landing analytics image"
                    width={100}
                    unoptimized
                    height={100}
                    className="w-full aspect-square shadow-2xl rounded-2xl absolute inset-0"
                />
            </motion.div>
        </div>
    )
}

export default LandingImages














