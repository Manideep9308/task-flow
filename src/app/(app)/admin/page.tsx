
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, Users, Settings, UserCircle, Edit3, Paintbrush, AlertTriangle, Search } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added Input import
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

const ROLES_AVAILABLE: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

const MOCK_THEMES = [
  { value: 'neon', label: 'Neon (Current)' },
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
];

export default function AdminPage() {
  const { assignableUsers, updateUserRole } = useAuth();
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(undefined);
  const [userSearchTerm, setUserSearchTerm] = useState(""); // State for user search

  // State for mock application settings
  const [selectedMockTheme, setSelectedMockTheme] = useState<string>('neon');
  const [isMaintenanceModeEnabled, setIsMaintenanceModeEnabled] = useState(false);

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

  const filteredUsers = assignableUsers.filter(user => {
    const searchTermLower = userSearchTerm.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(searchTermLower);
    const emailMatch = user.email.toLowerCase().includes(searchTermLower);
    return nameMatch || emailMatch;
  });

  return (
    <>
      <div className="container mx-auto">
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
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Overview
                </CardTitle>
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
                    <Settings className="h-5 w-5 text-primary" />
                    Application Settings
                  </CardTitle>
                  <CardDescription>Configure global application parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mock-theme-select" className="flex items-center gap-1">
                      <Paintbrush className="h-4 w-4" /> App Theme (Mock)
                    </Label>
                    <Select value={selectedMockTheme} onValueChange={setSelectedMockTheme}>
                      <SelectTrigger id="mock-theme-select">
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
                  <div className="flex items-center justify-between space-x-2 pt-2">
                    <Label htmlFor="maintenance-mode-switch" className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Enable Maintenance (Mock)
                    </Label>
                    <Switch 
                      id="maintenance-mode-switch" 
                      checked={isMaintenanceModeEnabled}
                      onCheckedChange={setIsMaintenanceModeEnabled}
                    />
                  </div>
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
