'use client';

import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [totalUsers, totalProfiles, pendingProfiles, totalBookings] = await Promise.all([
    prisma.user.count(),
    prisma.escortProfile.count(),
    prisma.escortProfile.count({ where: { status: 'PENDING' } }),
    prisma.booking.count(),
  ]);

  return {
    totalUsers,
    totalProfiles,
    pendingProfiles,
    totalBookings,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-6">
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="text-sm text-gray-500">Gesamte Benutzer</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-2xl font-bold">{stats.totalProfiles}</div>
            <div className="text-sm text-gray-500">Escort Profile</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-2xl font-bold">{stats.pendingProfiles}</div>
            <div className="text-sm text-gray-500">Ausstehende Profile</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <div className="text-sm text-gray-500">Gesamte Buchungen</div>
          </div>
        </Card>
      </div>

      {/* Weitere Dashboard-Komponenten hier */}
    </div>
  );
}