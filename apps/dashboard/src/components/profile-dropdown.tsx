"use client"

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { signOut } from "next-auth/react";
import { Book, Layout, LogOut, Router, Trash2 } from "lucide-react";
import { formatError } from "@/utils/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ProfileDropdown = ({ image, userInitials, name, email }: { image?: string; userInitials: string; name?: string; email?: string }) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('')
    const router = useRouter();

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
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Avatar className="h-10 w-10 border border-slate-100 cursor-pointer">
                    <AvatarImage src={image || undefined} alt="Profile" />
                    <AvatarFallback className="bg-linear-to-br from-green-600 to-green-800 text-white">
                        {userInitials}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 truncate">{name || "Visly User"}</p>
                        <p className="text-xs text-slate-500 truncate">{email || "Email"}</p>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="w-full text-slate-600 hover:text-green-600 hover:bg-slate-50 border-slate-200 cursor-pointer"
                    onClick={() => {
                        router.push('/dashboard')
                    }}
                >
                    <Layout size={16} className="mr-2" />
                    Dashboard
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="w-full text-slate-600 hover:text-green-600 hover:bg-slate-50 border-slate-200 cursor-pointer"
                    onClick={() => {
                        router.push('/dashboard')
                    }}
                >
                    <Book size={16} className="mr-2" />
                    Docs
                </DropdownMenuItem>


                <DropdownMenuItem
                    className="w-full text-slate-600 hover:text-red-600 hover:bg-slate-50 border-slate-200 cursor-pointer"
                    onClick={() => {
                        signOut()
                        router.push('/')
                    }}
                >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="text-red-500 hover:text-red-600 py-1.5 hover:bg-red-50 w-full border-slate-200 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setOpen(true);
                    }}
                >
                    <Trash2 size={14} className="mr-2" />
                    Delete Account
                </DropdownMenuItem>
            </DropdownMenuContent>

            {/* Controlled Dialog placed next to Dropdown (not nested inside menu content) */}
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
        </DropdownMenu>
    );
};

export default ProfileDropdown;
