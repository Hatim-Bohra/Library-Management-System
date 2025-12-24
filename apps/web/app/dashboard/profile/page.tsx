"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>User ID</Label>
                            <Input value={user.sub} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Input value={user.role} disabled />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user.email} disabled />
                    </div>

                    {/* Backend doesn't send First/Last name in simple JWT often, 
                        would need specific API call to get details if not in token.
                        For now just showing what we have or placeholder */}
                </CardContent>
            </Card>
        </div>
    );
}
