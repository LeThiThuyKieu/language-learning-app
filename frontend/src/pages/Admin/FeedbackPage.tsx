import React from "react";

const mockFeedback = [
  { id: 101, tree: "Basic Vocabulary", user: "alice@example.com", name: "Alice", rating: 3, createdAt: "2026-05-20 10:12" },
  { id: 102, tree: "Verb Tenses", user: "bob@example.com", name: "Bob", rating: 5, createdAt: "2026-05-21 14:03" },
  { id: 103, tree: "Listening 1", user: "carol@example.com", name: "Carol", rating: 2, createdAt: "2026-05-22 08:45" },
];

export default function FeedbackPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Feedback (View-only)</h1>

      <p className="text-sm text-slate-600 mb-4">Read-only list of feedback entries. UI-only mock data.</p>

      <div className="bg-white shadow-sm rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Skill Tree</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Rating</th>
              <th className="p-3 text-left">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {mockFeedback.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 text-sm">{f.id}</td>
                <td className="p-3 text-sm">{f.tree}</td>
                <td className="p-3 text-sm">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-slate-500">{f.user}</div>
                </td>
                <td className="p-3 text-sm">{f.rating} / 5</td>
                <td className="p-3 text-sm">{f.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
