import React from "react";

const mockBadges = [
  { id: 1, name: "First Steps", requiredKn: 10, icon: "/logo/icon-192.png", description: "Complete 10 KN" },
  { id: 2, name: "Scholar", requiredKn: 50, icon: "/logo/icon-192.png", description: "Reach 50 KN" },
  { id: 3, name: "Master", requiredKn: 200, icon: "/logo/icon-192.png", description: "Reach 200 KN" },
];

export default function BadgesManagementPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Badges Management (UI only)</h1>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-600">This page is UI-only. No backend actions performed.</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-primary-600 text-white rounded">New Badge</button>
          <button className="px-3 py-1 border rounded">Import</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-md overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>
              <th className="w-20 p-3 text-left">ID</th>
              <th className="p-3 text-left">Badge</th>
              <th className="p-3 text-left">Required KN</th>
              <th className="p-3 text-left">Description</th>
              <th className="w-40 p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockBadges.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 text-sm">{b.id}</td>
                <td className="p-3 flex items-center gap-3">
                  <img src={b.icon} alt={b.name} className="w-10 h-10 rounded" />
                  <div>
                    <div className="font-medium">{b.name}</div>
                  </div>
                </td>
                <td className="p-3 text-sm">{b.requiredKn}</td>
                <td className="p-3 text-sm text-slate-700">{b.description}</td>
                <td className="p-3">
                  <div className="flex gap-2 justify-end">
                    <button className="px-2 py-1 border rounded text-sm">Edit</button>
                    <button className="px-2 py-1 border rounded text-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
