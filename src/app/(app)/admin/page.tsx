
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, Users, Settings, UserCircle, Edit3, Paintbrush, AlertTriangle, Search, Info, Send, MailPlus } from "lucide-react"; // Added Info, Send, MailPlus icons
import { useAuth } from "@/contexts/auth-context";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UserRole } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast"; // Added useToast

const ROLES_AVAILABLE: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

const MOCK_THEMES = [
  { value: 'neon', label: 'Neon (Current)' },
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
];

interface MockSentInvitation {
  email: string;
  role: UserRole;
  sentAt: Date;
}

export default function AdminPage() {
  const { assignableUsers, updateUserRole } = useAuth();
  const { toast } = useToast();
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(undefined);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const [selectedMockTheme, setSelectedMockTheme] = useState<string>('neon');
  const [isMaintenanceModeEnabled, setIsMaintenanceModeEnabled] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [mockSentInvitations, setMockSentInvitations] = useState<MockSentInvitation[]>([]);

  const handleOpenEditRoleDialog = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setIsEditRoleDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (editingUser && selectedRole) {
      updateUserRole(editingUser.id, selectedRole);
    }
    setIsEditRoleDialogOpen(false);
    setEditingUser(null);
  };

  const handleSendInvitation = () => {
    if (!inviteEmail.trim() || !/\S+@\S+\.\S+/.test(inviteEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address to send an invitation.",
      });
      return;
    }
    const newInvitation: MockSentInvitation = {
      email: inviteEmail,
      role: inviteRole,
      sentAt: new Date(),
    };
    setMockSentInvitations(prev => [newInvitation, ...prev]);
    toast({
      title: "Mock Invitation Sent",
      description: `An invitation has been 'sent' to ${inviteEmail} for the role of ${inviteRole}. (This is a mock feature).`,
    });
    setInviteEmail(""); // Clear input after sending
  };

  const filteredUsers = assignableUsers.filter(user => {
    const searchTermLower = userSearchTerm.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(searchTermLower);
    const emailMatch = user.email.toLowerCase().includes(searchTermLower);
    return nameMatch || emailMatch;
  });

  return (
    <>
      <div className="container mx-auto pt-0">
        <Card className="shadow-xl mt-2 md:mt-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Admin Control Panel</CardTitle>
                <CardDescription className="text-md">
                  Manage application users, settings, and monitor system health.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow col-span-1 lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    User Overview
                  </CardTitle>
                </div>
                <CardDescription>List of all registered users in the system.</CardDescription>
                <div className="pt-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search users by name or email..."
                      className="w-full rounded-lg bg-background pl-8"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length > 0 ? (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {filteredUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 text-sm">
                              <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name || 'Unnamed User'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                              {user.role}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditRoleDialog(user)} title="Edit Role">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {userSearchTerm ? "No users found matching your search." : "No users found."}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6 col-span-1">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MailPlus className="h-5 w-5 text-primary" />
                    Invite Team Members
                  </CardTitle>
                  <CardDescription>Send invitations to new team members (Mock).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="new.member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Assign Role</Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                      <SelectTrigger id="invite-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES_AVAILABLE.map(roleOpt => (
                          <SelectItem key={roleOpt.value} value={roleOpt.value}>
                            {roleOpt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSendInvitation} className="w-full">
                    <Send className="mr-2 h-4 w-4" /> Send Invitation (Mock)
                  </Button>
                  {mockSentInvitations.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Recently Invited (Mock):</h4>
                      <ScrollArea className="h-[100px] text-xs">
                        <ul className="space-y-1">
                          {mockSentInvitations.map((inv, index) => (
                            <li key={index} className="flex justify-between items-center p-1 bg-muted/20 rounded-sm">
                              <span>{inv.email} ({inv.role})</span>
                              <span className="text-muted-foreground/70">{inv.sentAt.toLocaleTimeString()}</span>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>


              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Application Settings
                  </CardTitle>
                  <CardDescription>Configure global application parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="mock-theme-select" className="flex items-center gap-1 font-medium">
                      <Paintbrush className="h-4 w-4" /> App Theme (Mock)
                    </Label>
                    <Select value={selectedMockTheme} onValueChange={setSelectedMockTheme}>
                      <SelectTrigger id="mock-theme-select" className="w-full">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_THEMES.map(themeOpt => (
                          <SelectItem key={themeOpt.value} value={themeOpt.value}>
                            {themeOpt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                     <div className="flex items-center justify-between">
                        <Label htmlFor="maintenance-mode-switch" className="flex items-center gap-1 font-medium">
                          <AlertTriangle className="h-4 w-4" /> Enable Maintenance (Mock)
                        </Label>
                        <Switch
                          id="maintenance-mode-switch"
                          checked={isMaintenanceModeEnabled}
                          onCheckedChange={setIsMaintenanceModeEnabled}
                        />
                    </div>
                  </div>
                  {isMaintenanceModeEnabled && (
                    <Alert variant="default" className="mt-2 border-primary/50 bg-primary/10">
                      <Info className="h-4 w-4 text-primary" />
                      <AlertTitle className="text-primary font-medium">Mock Maintenance Mode ON</AlertTitle>
                      <AlertDescription className="text-primary/80">
                        This is a visual indicator on the admin page only and does not affect the live application.
                      </AlertDescription>
                    </Alert>
                  )}

                   <p className="text-xs text-muted-foreground pt-2">
                    These settings are for demonstration and do not persist or affect the actual application.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-primary" />
                    Manage Roles (Conceptual)
                  </CardTitle>
                  <CardDescription>Define and assign user roles and permissions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Role changes for individual users are handled in "User Overview". Advanced role/permission definition is a backend feature.
                  </p>
                  <Button variant="outline" className="mt-3 w-full" disabled>Advanced Role Management</Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {editingUser && (
        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role for {editingUser.name || editingUser.email}</DialogTitle>
              <DialogDescription>
                Select a new role for this user. Changes are mock and session-based.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="role-select">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as UserRole)}
              >
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_AVAILABLE.map(roleOpt => (
                    <SelectItem key={roleOpt.value} value={roleOpt.value}>
                      {roleOpt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRole}>Save Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
