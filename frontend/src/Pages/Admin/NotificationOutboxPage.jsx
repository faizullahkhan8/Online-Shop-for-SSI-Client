import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/apiClient";
import { PageLoading } from "../../Components/UI/PageLoading";
import { QueryError } from "../../UI/QueryState";
export default function NotificationOutboxPage() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [selected, setSelected] = useState(null);
    const [action, setAction] = useState("retry");
    const [reason, setReason] = useState("");
    const [reference, setReference] = useState("");
    const client = useQueryClient();
    const query = useQuery({ queryKey: ["notification-outbox", page, status], queryFn: async () => (await apiClient.get("/business/notifications", { params: { page, status } })).data, refetchInterval: 10000 });
    const recovery = useMutation({ mutationFn: async () => apiClient.post(`/business/notifications/${selected._id}/recovery`, { action, reason, reference }), onSuccess: () => { setSelected(null); setReason(""); setReference(""); client.invalidateQueries({ queryKey: ["notification-outbox"] }); } });
    if (query.isLoading) return <PageLoading variant="table" />;
    if (query.error) return <QueryError />;
    const events = query.data?.events || [];
    return <div className="space-y-6"><header><h2 className="text-2xl font-semibold">Notification delivery</h2><p className="mt-2 text-sm text-gray-600">Accepted means the provider accepted the request. Unknown deliveries require provider confirmation before any retry.</p></header>
        <label className="block text-sm">Filter status<select className="ml-3 rounded-lg border p-2" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All</option>{["pending", "processing", "accepted", "blocked", "unknown"].map(s => <option key={s}>{s}</option>)}</select></label>
        {selected && <form onSubmit={e => { e.preventDefault(); recovery.mutate(); }} className="space-y-4 rounded-2xl border bg-white p-5"><h3 className="font-semibold">Recover {selected.eventName}</h3>{selected.status === "unknown" && <label className="block text-sm">Provider outcome<select value={action} onChange={e => setAction(e.target.value)} className="ml-3 rounded-lg border p-2"><option value="confirm_accepted">Confirmed accepted</option><option value="confirm_not_sent">Confirmed not sent</option></select></label>}
            <label className="block text-sm">Reason<input required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>{selected.status === "unknown" && <label className="block text-sm">Provider confirmation reference<input required maxLength={200} value={reference} onChange={e => setReference(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>}
            {recovery.error && <p role="alert" className="text-sm text-red-700">{recovery.error.response?.data?.message || "Recovery failed"}</p>}<div className="flex gap-3"><button disabled={recovery.isPending} className="rounded-lg bg-primary px-4 py-2 text-white">{recovery.isPending ? "Saving…" : selected.status === "unknown" ? "Record confirmation" : "Queue retry"}</button><button type="button" onClick={() => setSelected(null)}>Cancel</button></div></form>}
        <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{["Event", "Source", "Status", "Attempts", "Details", "Action"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{events.map(event => <tr key={event._id} className="border-t"><td className="p-3">{event.eventName}</td><td className="p-3 break-all">{event.sourceType}: {event.sourceId}</td><td className="p-3">{event.status}</td><td className="p-3">{event.attempts}</td><td className="p-3">{event.errorCode || event.messageId || "—"}</td><td className="p-3">{["blocked", "unknown"].includes(event.status) && <button className="rounded-lg border px-3 py-2" onClick={() => { setSelected(event); setAction(event.status === "unknown" ? "confirm_accepted" : "retry"); recovery.reset(); }}>Recover</button>}</td></tr>)}</tbody></table>{!events.length && <p className="p-6 text-gray-600">No matching notifications.</p>}</div>
        <div className="flex items-center gap-4"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-50">Previous</button><span>Page {page}</span><button disabled={events.length < 25} onClick={() => setPage(p => p + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-50">Next</button></div>
    </div>;
}
