import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import Link from 'next/link'
import { ArrowUpRight, Coffee, Github, IndianRupee } from 'lucide-react'

const CommunityCard = () => {
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">Community & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                <Button variant="secondary" asChild className="w-full justify-between bg-slate-50 hover:bg-slate-100 text-slate-700 h-auto py-2.5 font-medium">
                    <Link href="https://github.com/nikhilsaiankilla/visly" target="_blank">
                        <span className="flex items-center gap-2"><Github size={16} /> Star on GitHub</span>
                        <ArrowUpRight size={14} className="text-slate-400" />
                    </Link>
                </Button>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button variant="outline" asChild className="w-full justify-between bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100 h-auto py-2.5 font-medium">
                        <Link href="https://razorpay.me/@nikhilsaiankilla" target="_blank">
                            <span className="flex items-center gap-2 text-xs"><IndianRupee size={16} /> Razorpay</span>
                            <ArrowUpRight size={14} className="text-blue-400" />
                        </Link>
                    </Button>

                    <Button variant="outline" asChild className="w-full justify-between bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100 h-auto py-2.5 font-medium">
                        <Link href="https://buymeacoffee.com/nikhilsaiankilla" target="_blank">
                            <span className="flex items-center gap-2 text-xs"><Coffee size={16} /> Coffee</span>
                            <ArrowUpRight size={14} className="text-amber-400" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default CommunityCard