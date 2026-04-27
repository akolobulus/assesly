
"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import 'intro.js/introjs.css';
import { Steps } from 'intro.js-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FileText, Users, Folder as FolderIcon, ChevronDown, FolderPlus, Settings, Trash2, Rocket, LogOut, Sun, Moon, Laptop as SystemIcon, UserCircle, HelpCircle, MessageSquare, EllipsisVertical, UserPlus, DollarSign, AlertCircle, Loader2, WifiOff, Bell, CheckCheck, CircleX } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { signOut, getAuth } from "firebase/auth";
import { useAuth } from '@/hooks/useAuth'; // Use the new hook
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreateFolderModal } from '@/components/dashboard/folders/CreateFolderModal';
import { getFoldersForCurrentUser, trashFolder, type Folder } from '@/lib/services/folderService';
import { getNotificationsForUser, type SerializableNotification } from '@/lib/services/notificationService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RenameFolderModal } from '@/components/dashboard/folders/RenameFolderModal';
import { DeleteFolderModal } from '@/components/dashboard/folders/DeleteFolderModal';
import { format, formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { app } from '@/lib/firebase';

const mainNavItems = [
  { id: 'my-forms', href: '/dashboard/forms', label: 'My Forms', icon: <FileText /> },
  { id: 'teams', href: '/dashboard/teams', label: 'Teams', icon: <Users /> },
];

const utilityNavItems = [
  { id: 'settings', href: '/dashboard/settings', label: 'Settings', icon: <Settings /> },
  { id: 'trash', href: '/dashboard/trash', label: 'Trash', icon: <Trash2 /> },
];

interface NotificationItem extends SerializableNotification {
  timeAgo: string;
  absoluteTime: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isFoldersOpen, setIsFoldersOpen] = React.useState(true);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = React.useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = React.useState(false);
  const { user: currentUser, loading: isLoadingAuth } = useAuth(); // Use the hook
  const auth = getAuth(app);
  const [folders, setFolders] = React.useState<Folder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = React.useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [folderToRename, setFolderToRename] = React.useState<Folder | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [folderToDelete, setFolderToDelete] = React.useState<Folder | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = React.useState(false);

  const [isTourEnabled, setIsTourEnabled] = useState(false);

  const tourSteps = [
    { element: '[data-tour="my-forms"]', intro: 'This is where all your forms live.', position: 'right' },
    { element: '[data-tour="folders"]', intro: 'Organize your forms into folders.', position: 'right' },
    { element: '[data-tour="teams"]', intro: 'Manage collaboration invites and access forms that have been shared with you.', position: 'right'},
    { element: '[data-tour="pending-invites-tab"]', intro: 'Accept or decline invitations to collaborate on forms from other users here.', position: 'bottom'},
    { element: '[data-tour="shared-forms-tab"]', intro: 'Once you accept an invitation, the form will appear here, ready for you to edit.', position: 'bottom'},
    { element: '[data-tour="settings"]', intro: 'Manage your account settings.', position: 'right' },
    { element: '[data-tour="trash"]', intro: 'Find deleted items here.', position: 'right' },
    { element: '[data-tour="notifications"]', intro: 'Check your notifications here.', position: 'bottom' },
    { element: '[data-tour="profile"]', intro: 'Access your profile and log out.', position: 'bottom-end' },
    { element: '[data-tour="demo"]', intro: "Restart this tour anytime.", position: 'top' },
  ];

  const onTourExit = () => setIsTourEnabled(false);

  const fetchNotificationData = React.useCallback(async (userId: string, userEmail: string | null) => {
    const fetchedNotifications = await getNotificationsForUser(userId, userEmail);
    const lastClearedTimestamp = Number(localStorage.getItem(`notificationsLastCleared_${userId}`) || '0');

    const processedNotifications = fetchedNotifications
      .filter(n => new Date(n.createdAt).getTime() > lastClearedTimestamp)
      .map(n => ({
        ...n,
        timeAgo: n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : "just now",
        absoluteTime: n.createdAt ? format(new Date(n.createdAt), 'PP p') : 'N/A',
      }));
    
    setNotifications(processedNotifications);
    setUnreadCount(processedNotifications.filter(n => !n.read).length);
  }, []);
  
  const handleMarkAllAsRead = () => {
    setNotifications(currentNotifications => 
        currentNotifications.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
    // In a real app, you'd also update the read status in Firestore.
  };
  
  const handleClearAll = () => {
    if (currentUser) {
        localStorage.setItem(`notificationsLastCleared_${currentUser.uid}`, String(Date.now()));
    }
    setNotifications([]);
    setUnreadCount(0);
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchFolders = React.useCallback(async () => {
    setIsLoadingFolders(true);
    const userFolders = await getFoldersForCurrentUser();
    setFolders(userFolders);
    setIsLoadingFolders(false);
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      fetchFolders();
      fetchNotificationData(currentUser.uid, currentUser.email);
    } else if (!isLoadingAuth && !currentUser) {
      setFolders([]);
      setIsLoadingFolders(false);
      if (!['/login', '/signup', '/recover-password'].some(p => pathname.startsWith(p))) {
        router.replace("/login");
      }
    }
  }, [currentUser, isLoadingAuth, fetchFolders, fetchNotificationData, pathname, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth); // Use auth from useAuth
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push("/login"); 
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  };

  const handleFolderCreated = (newFolder: Folder) => {
    setFolders(prev => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleRenameClick = (folder: Folder) => {
    setFolderToRename(folder);
    setIsRenameModalOpen(true);
  };

  const handleDeleteClick = (folder: Folder) => {
    setFolderToDelete(folder);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    setIsDeletingFolder(true);
    const result = await trashFolder(folderToDelete.id);
    if (result.success) {
      toast({ title: "Folder Moved to Trash" });
      fetchFolders();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsDeletingFolder(false);
    setIsDeleteModalOpen(false);
    setFolderToDelete(null);
  };
  
  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const NotificationItemContent = ({ notif }: { notif: NotificationItem }) => (
    <DropdownMenuItem className={cn("flex flex-col items-start gap-1 p-3 cursor-pointer", !notif.read && "bg-primary/5")}>
        <div className="flex items-center w-full">
            {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mr-3 flex-shrink-0" />}
            <p className="text-sm font-medium text-foreground whitespace-normal flex-1">{notif.message}</p>
        </div>
        <TooltipProvider><Tooltip><TooltipTrigger asChild><p className={cn("text-xs text-muted-foreground cursor-default", !notif.read && "pl-5")}>{notif.timeAgo}</p></TooltipTrigger><TooltipContent><p>{notif.absoluteTime}</p></TooltipContent></Tooltip></TooltipProvider>
    </DropdownMenuItem>
  );

  return (
    <SidebarProvider refetchFolders={fetchFolders}>
      <Steps enabled={isTourEnabled} steps={tourSteps} initialStep={0} onExit={onTourExit} options={{ tooltipClass: 'custom-introjs-tooltip', highlightClass: 'custom-introjs-highlight' }} />
      <Sidebar variant="sidebar" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="h-20 pl-6 pr-4 flex items-start justify-start mb-6">
          <Link href="/dashboard" className="block">
            <Logo />
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-0 flex-grow flex flex-col">
          <SidebarMenu>
            {mainNavItems.map((item) => {
              const isActive = item.href === '/dashboard/forms' ? (pathname === '/dashboard/forms' || pathname.startsWith('/dashboard/folders/')) : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.label} data-tour={item.id}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton isActive={isActive} tooltip={{ children: item.label, side: 'right' }} className={cn("text-[16px] gap-3 min-h-[44px] data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isActive && "border-r-[5px] border-primary")}>
                      {React.cloneElement(item.icon, { className: cn("w-5 h-5", isActive && "text-primary")})}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
          <SidebarGroup className="px-2 pt-2 pb-0 flex flex-col flex-1 min-h-0" data-tour="folders">
            <SidebarGroupLabel className="flex items-center justify-between px-2">
              <div onClick={() => setIsFoldersOpen(!isFoldersOpen)} className="flex flex-1 items-center cursor-pointer hover:text-sidebar-foreground">
                <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", isFoldersOpen ? 'rotate-0' : '-rotate-90')} />
                <span className="text-sm font-medium">Folders</span>
                {folders.length > 0 && !isLoadingFolders && <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs font-semibold">{folders.length}</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-sidebar-accent" onClick={() => setIsCreateFolderModalOpen(true)} disabled={!currentUser}>
                <FolderPlus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </SidebarGroupLabel>
            {isFoldersOpen && (
              <SidebarGroupContent className="overflow-y-auto max-h-full pr-2 custom-scroll">
                {isLoadingFolders && currentUser && <div className="flex justify-center items-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
                {!isLoadingFolders && folders.length === 0 && currentUser && <p className="px-2 py-3 text-xs text-muted-foreground text-center">No folders yet.</p>}
                {!currentUser && !isLoadingFolders && <p className="px-2 py-3 text-xs text-muted-foreground text-center">Login to see folders.</p>}
                <SidebarMenu>
                  {folders.map((folder) => (
                    <SidebarMenuItem key={folder.id} className="flex items-center justify-between">
                       <Link href={`/dashboard/folders/${folder.id}`} legacyBehavior passHref>
                        <SidebarMenuButton isActive={pathname.startsWith(`/dashboard/folders/${folder.id}`)} tooltip={{ children: folder.name, side: 'right' }} className={cn("text-[12px] gap-3 min-h-[36px] px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground", "flex-grow min-w-0 mr-1")}>
                          <div className="flex items-center w-full">
                            <FolderIcon className="h-4 w-4 mr-2 opacity-70" />
                            <span className="flex-grow truncate">{folder.name}</span>
                          </div>
                        </SidebarMenuButton>
                      </Link>
                      <div className="pl-1 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-sidebar-accent"><EllipsisVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="end">
                            <DropdownMenuItem onClick={() => handleRenameClick(folder)}>Rename</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteClick(folder)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
          <SidebarMenu className="mt-auto border-t border-sidebar-border pt-2">
            {utilityNavItems.map((item) => (
              <SidebarMenuItem key={item.label} data-tour={item.id}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={{ children: item.label, side: 'right' }} className={cn("text-[16px] p-5 gap-3 min-h-[44px] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground", pathname.startsWith(item.href) && "border-r-[5px] border-primary")}>
                     {React.cloneElement(item.icon, { className: cn("h-5 w-5", pathname.startsWith(item.href) && "text-primary")})}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border" data-tour="demo">
          <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary" onClick={() => setIsTourEnabled(true)}><Rocket className="h-5 w-5 text-primary mr-2" /><span>View Demo</span></Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b bg-background px-4 md:px-6">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9" data-tour="notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">{unreadCount > 9 ? '9+' : unreadCount}</Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" side="bottom" align="end" sideOffset={10}>
                <DropdownMenuLabel className="flex justify-between items-center"><span className="font-semibold">Notifications</span>
                  {notifications.length > 0 && <div className="flex items-center gap-2">
                       <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-primary hover:text-primary" onClick={handleClearAll}><CircleX className="h-3 w-3 mr-1" />Clear All</Button>
                        <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-primary hover:text-primary" onClick={handleMarkAllAsRead}><CheckCheck className="h-3 w-3 mr-1" />Mark as read</Button>
                    </div>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <ScrollArea className="h-64">
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                          notif.link ? (
                            <Link href={notif.link} key={notif.id} passHref>
                              <NotificationItemContent notif={notif} />
                            </Link>
                          ) : (
                            <NotificationItemContent key={notif.id} notif={notif} />
                          )
                        ))
                    ) : (<div className="text-center py-10"><p className="text-sm text-muted-foreground">No new notifications.</p></div>)}
                  </ScrollArea>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 cursor-pointer" data-tour="profile"><AvatarImage src={currentUser?.photoURL || "https://placehold.co/40x40/E0E0E0/333333?text=U"} alt="User Avatar" data-ai-hint="user profile"/><AvatarFallback>{currentUser?.displayName ? currentUser.displayName.substring(0, 2).toUpperCase() : (currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : "U")}</AvatarFallback></Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent className="w-64" side="bottom" align="end" sideOffset={10}>
                <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none text-foreground">{currentUser?.displayName || "User"}</p><p className="text-xs leading-none text-muted-foreground">{currentUser?.email || "No email"}</p></div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {e.preventDefault(); setIsThemeSettingsOpen(!isThemeSettingsOpen);}} className="flex justify-between items-center cursor-pointer"><span>Select Theme</span><ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isThemeSettingsOpen && "rotate-180")} /></DropdownMenuItem>
                {isThemeSettingsOpen && (<div className="pt-1"><DropdownMenuRadioGroup value={theme} onValueChange={setTheme} className="pl-2 pr-2"><DropdownMenuRadioItem value="system" className="gap-2"><SystemIcon className="h-4 w-4" /><span>Device theme</span></DropdownMenuRadioItem><DropdownMenuRadioItem value="dark" className="gap-2"><Moon className="h-4 w-4" /><span>Dark</span></DropdownMenuRadioItem><DropdownMenuRadioItem value="light" className="gap-2"><Sun className="h-4 w-4" /><span>Light</span></DropdownMenuRadioItem></DropdownMenuRadioGroup></div>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem><Link href="/dashboard/settings" className="flex items-center w-full"><UserCircle className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                <DropdownMenuItem><Link href="/dashboard/settings" className="flex items-center w-full"><Settings className="mr-2 h-4 w-4" />Account</Link></DropdownMenuItem>
                {/* <DropdownMenuItem onClick={() => router.push('mailto:help@vetify.com')}><HelpCircle className="mr-2 h-4 w-4" />Help Center</DropdownMenuItem> */}
                {/* <DropdownMenuItem onClick={() => router.push('mailto:feedback@vetify.com')}><MessageSquare className="mr-2 h-4 w-4" />Feedback</DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
          {isOffline && <Alert variant="destructive" className="mb-6"><WifiOff className="h-4 w-4" /><AlertTitle>You are offline</AlertTitle><AlertDescription>Some features may be unavailable.</AlertDescription></Alert>}
          {children}
        </main>
      </SidebarInset>
      <CreateFolderModal isOpen={isCreateFolderModalOpen} onClose={() => setIsCreateFolderModalOpen(false)} onFolderCreated={handleFolderCreated} />
       <RenameFolderModal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} folder={folderToRename} onFolderRenamed={fetchFolders} />
      <DeleteFolderModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} folder={folderToDelete} isDeleting={isDeletingFolder} onConfirmDelete={handleConfirmDeleteFolder} />
    </SidebarProvider>
  );
}
