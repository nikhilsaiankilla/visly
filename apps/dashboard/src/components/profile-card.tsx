"use client";

import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { LogOut, Trash2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import CommunityCard from './community-card';

const ProfileCard = () => {
    const { data: session, status } = useSession();
    if (status !== 'authenticated' || !session.user) {
        return null;
    }

    const userInitials = session.user?.name
        ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
        : 'DV';

    return (
        <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Avatar className="h-12 w-12 border border-slate-100">
                            <AvatarImage src={session.user?.image || undefined} alt="Profile" />
                            <AvatarFallback className="bg-linear-to-br from-green-600 to-slate-800 text-white">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <p className="font-bold text-slate-900 truncate">{session.user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full justify-center text-slate-600 hover:text-red-600 hover:bg-slate-50 border-slate-200"
                            onClick={() => signOut()}
                        >
                            <LogOut size={16} className="mr-2" />
                            Sign Out
                        </Button>

                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 py-1.5 hover:bg-red-50 w-full justify-center border-slate-200">
                            <Trash2 size={14} className="mr-2" />
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Community & Support */}
            <CommunityCard />
        </div>
    )
}

export default ProfileCard