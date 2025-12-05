"use client";

import React, { useState } from "react";
import {
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    Globe,
    Calendar,
    ChevronRight,
    Trash2,
    Power,
    MoreVertical,
    Loader,
    ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Card from "@/app/components/card";
import { CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { formatDate, formatError } from "@/utils/utils";
import { toast } from "sonner";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";

export interface ProjectType {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    domain: string;
}

interface ProjectCardProps {
    project: ProjectType;
    index: number; // optional for animation staggering
    onToggleActive?: (projectId: string) => void | Promise<void>;
    onDelete?: (projectId: string) => void | Promise<void>;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, onDelete, onToggleActive }) => {
    const { id, name, domain, is_active, created_at } = project;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [delLoading, setDelLoading] = useState<boolean>(false)
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('')

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDelLoading(true)
        try {
            if (!value) {
                toast.error("Type DELETE to continue.");
                setDelLoading(false)
                return
            }

            if (value !== "DELETE") {
                toast.error("The confirmation text must be exactly: DELETE");
                setDelLoading(false)
                return
            }

            const res = await fetch(`/api/project?id=${id}`, {
                method: 'DELETE'
            })

            if (!res.ok) {
                setDelLoading(false);
                return toast.error('something went wrong please try again')
            }

            const json = await res.json();

            if (!json.ok) {
                setDelLoading(false);
                return toast.error(json.error)
            }

            if (onDelete) {
                onDelete(id);
            }

            setDelLoading(false)
            toast.success(json.message);
        } catch (error: unknown) {
            setDelLoading(false);
            return toast.error(formatError(error))
        }
    };
    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLoading(true)

        const payload = {
            is_active: is_active === true ? false : true,
            projectId: id
        }

        try {
            const res = await fetch(`/api/project/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                setIsLoading(false)
                return toast.error('Something went wrong please try again later')
            }

            const json = await res.json();

            if (!json.ok) {
                setIsLoading(false)
                return toast.error(json.error);
            }

            toast.success(json.message);
            if (onToggleActive) {
                onToggleActive(id)
            }
            setIsLoading(false)
        } catch (error: unknown) {
            setIsLoading(false)
            return toast.error(formatError(error))
        }
    }

    return (
        <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link href={`/dashboard/analytics/${id}`} className="block h-full">
                <Card className="group hover:shadow-lg hover:border-green-600/40 transition-all duration-300 cursor-pointer border-slate-200 bg-white flex flex-col relative overflow-hidden aspect-video py-5 space-y-2">

                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${is_active ? 'bg-green-600' : 'bg-slate-300'}`} />

                    <CardHeader className="px-6 flex flex-row items-start justify-between">
                        <div className="flex gap-3 items-center">
                            {/* Avatar / Icon */}
                            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg group-hover:bg-green-600/10 group-hover:text-green-600 transition-colors">
                                {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 capitalize leading-none mb-1 group-hover:text-green-600 transition-colors">
                                    {name}
                                </h4>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                                    {id.slice(0, 8)}...
                                </span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className={`text-xs font-medium px-2 py-0.5 ${is_active
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                    }`}
                            >
                                {is_active ? (
                                    <CheckCircle2 size={12} className="mr-1" />
                                ) : (
                                    <XCircle size={12} className="mr-1" />
                                )}
                                {is_active ? "Active" : "Inactive"}
                            </Badge>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                                    >
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical size={16} />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem
                                        className="gap-2 cursor-pointer text-slate-600 focus:text-slate-900"
                                    >
                                        <Button
                                            disabled={isLoading || delLoading}
                                            onClick={handleToggle}
                                            className="cursor-pointer bg-white hover:bg-white text-black"
                                        >
                                            {isLoading
                                                ?
                                                <>
                                                    <Loader className="animate-spin" />
                                                    updating
                                                </>
                                                :
                                                is_active ? (
                                                    <>
                                                        <Power size={14} />
                                                        <span>Deactivate</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 size={14} className="text-green-600" />
                                                        <span>Activate</span>
                                                    </>
                                                )
                                            }
                                        </Button>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                    >
                                        <Button
                                            disabled={isLoading || delLoading}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setOpen(true);
                                            }}
                                            className="gap-2 cursor-pointer text-red-600 hover:text-red-600 bg-white hover:bg-white"
                                        >
                                            {delLoading
                                                ?
                                                <>
                                                    <Loader className="animate-spin" />
                                                    Deleting
                                                </>
                                                :
                                                <>
                                                    <Trash2 size={14} />
                                                    <span>Delete Project</span>
                                                </>
                                            }
                                        </Button>

                                    </DropdownMenuItem>

                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>

                    <CardContent className="grow space-y-2">
                        {/* Domain Link */}
                        <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-100 group-hover:border-[#6A8E58]/20 transition-colors">
                            <Globe size={14} className="text-slate-400" />
                            <a
                                href={`https://${domain}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm text-slate-600 hover:text-[#6A8E58] hover:underline font-medium truncate flex-1"
                            >
                                {domain}
                            </a>
                            <ArrowUpRight size={12} className="text-slate-300" />
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-slate-400" />
                                <span>Created: {formatDate(created_at)}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-1 mt-3 border border-green-600 rounded-lg px-3 py-1.5 w-fit">
                            <span className="text-sm">Open Project</span>

                            <ArrowRight className="text-green-600" size={14} />
                        </div>
                    </CardContent>
                </Card>
            </Link>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle className="text-red-600">
                                Delete Visly Project
                            </DialogTitle>
                            <DialogDescription className="space-y-2">
                                <p className="text-slate-600">
                                    This action <span className="font-semibold text-red-600">cannot be undone</span>.
                                    Deleting this project will permanently remove:
                                </p>
                                <ul className="list-disc list-inside text-slate-600 text-sm">
                                    <li>All project data</li>
                                    <li>Associated analytics & events</li>
                                    <li>All related configuration</li>
                                </ul>

                                <p className="mt-3 text-sm text-slate-600">
                                    To confirm, type <span className="font-semibold">DELETE</span> below.
                                </p>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 mt-4">
                            <Input
                                id="confirm"
                                name="confirm"
                                placeholder="Type DELETE to confirm"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button
                                variant="destructive"
                                disabled={value !== "DELETE"}
                                onClick={handleDelete}
                            >
                                Delete Project
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default ProjectCard;
