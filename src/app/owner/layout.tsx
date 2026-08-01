"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TextBadge from "@/components/ui/TextBadge";
import Navbar from "@/components/layout/Navbar";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading, isOwner, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to complete

    if (!user) {
      router.push("/");
      return;
    }

    // Check if user is owner after profile loads
    if (userProfile && !isOwner()) {
      router.push("/");
      return;
    }
  }, [user, userProfile, loading, router, isOwner]);

  // Show loading while auth is being checked
  if (loading || !user || (userProfile && !isOwner())) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TextBadge variant="default">AUTHENTICATING...</TextBadge>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {userProfile && <Navbar user={userProfile} onSignOut={signOut} />}
      {children}
    </div>
  );
}
