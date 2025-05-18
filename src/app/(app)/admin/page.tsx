
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, Users, Settings, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminPage() {
  const { assignableUsers } = useAuth();

  return (
    <div className="container mx-auto py-2 md:py-6">
      <Card className="shadow-xl">
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
            </CardHeader>
            <CardContent>
              {assignableUsers.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {assignableUsers.map(user => (
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
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-8">No users found.</p>
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
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Placeholder for application settings. (e.g., theme, notifications, API keys).
                </p>
                <Button variant="outline" className="mt-3 w-full" disabled>Configure Settings</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                   <UserCircle className="h-5 w-5 text-primary" />
                  Manage Roles
                </CardTitle>
                 <CardDescription>Define and assign user roles and permissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Placeholder for role management tools.
                </p>
                 <Button variant="outline" className="mt-3 w-full" disabled>Manage Roles</Button>
              </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
