"use client";

import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { LogOut, Trash2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import CommunityCard from './community-card';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatError } from '@/utils/utils';
import { useRouter } from 'next/navigation';

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from './ui/input';

const ProfileCard = () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('')
    const router = useRouter();


    const { data: session, status } = useSession();
    if (status !== 'authenticated' || !session.user) {
        return null;
    }

    const userInitials = session.user?.name
        ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
        : 'DV';

    const deleteAccountHandler = async (e: any) => {
        try {
            e.preventDefault();

            if (!value) return toast.error("Type DELETE to continue.");

            if (value !== "DELETE") return toast.error("The confirmation text must be exactly: DELETE");

            console.log("Account delete handler");

            const res = await fetch('/aapi/account', {
                method: 'DELETE',
            })

            if (res.ok) {
                return toast.error('Something went wrong please try again later!!!')
            }

            const json = await res.json();

            if (!json.ok) {
                return toast.error(json.error || 'Something went wrong please try again later!!!')
            }

            toast.success('Account deleted successfully')
            setOpen(false);
        } catch (error: unknown) {
            const err = formatError(error);
            console.log("account delete handler error ", err);
        }
    };

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

                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 py-1.5 hover:bg-red-50 w-full justify-center border-slate-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setOpen(true);
                            }}
                        >
                            <Trash2 size={14} className="mr-2" />
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form>
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-red-600">
                                Delete Account
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-sm text-slate-700">
                                This action <span className="font-semibold text-red-600">cannot be undone</span>.
                                Deleting your account will permanently remove:
                                <ul className="list-disc list-inside mt-2 text-slate-600">
                                    <li>Your profile and personal data</li>
                                    <li>All projects, analytics and related data</li>
                                    <li>Access to the account and any paid features</li>
                                </ul>

                                <p className="mt-3 text-sm">
                                    To confirm, type <span className="font-semibold">DELETE</span> in the box below.
                                </p>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 mt-4">
                            <Input
                                id="confirm"
                                name="confirm"
                                placeholder='Type "DELETE" to confirm'
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                aria-label="Type DELETE to confirm account deletion"
                                autoFocus
                            />
                            <p className="text-xs text-slate-500">
                                Note: This action is <span className="font-semibold">irreversible</span>.
                            </p>
                        </div>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </DialogClose>
                            <Button onClick={deleteAccountHandler} variant="destructive" disabled={!value} >Delete Account</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Community & Support */}
            <CommunityCard />
        </div>
    )
}

export default ProfileCard