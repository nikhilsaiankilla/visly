import { Github, Linkedin, Twitter } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
    return (
        <footer className="border-t border-slate-100 bg-white py-12 px-4 md:px-10 lg:px-28">
            <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                {/* Logo */}
                <Link href="/" className="flex items-center font-bold text-xl text-slate-900 gap-2">
                    <Image src={'/visly.png'} alt="visly logo" width={20} height={20} />
                </Link>
                <div className="text-sm text-slate-500">
                    © {new Date().getFullYear()} Visly Inc. All rights reserved.
                </div>
                <div className="flex gap-6 text-slate-400">
                    <Link href="https://x.com/nikhilbuildss" className="hover:text-slate-900 transition-colors"><Twitter size={20} className='text-black hover:text-green-600' /></Link>
                    <Link href="https://github.com/nikhilsaiankilla/visly" className="hover:text-slate-900 transition-colors">
                        <Github size={20} className='text-black hover:text-green-600' />
                    </Link>
                    <Link href="https://linkedin.com/in/nikhilsaiankilla" className="hover:text-slate-900 transition-colors">
                        <Linkedin size={20} className='text-black hover:text-green-600' />
                    </Link>
                </div>
            </div>
        </footer>
    )
}

export default Footer