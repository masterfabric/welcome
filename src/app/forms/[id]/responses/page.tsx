"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { listResponsesForOwner, exportResponses } from '@/lib/supabase/submissions'

export default function ResponsesPage() {
  const params = useParams() as { id: string }
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data, error } = await listResponsesForOwner(params.id)
      if (error) setError(error.message)
      if (mounted && data) setRows(data)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [params.id])

  async function onExport() {
    const { data, error } = await exportResponses(params.id)
    if (error) { setError(error.message); return }
    // simple CSV client export
    const header = ['submission_id','submission_created_at','submitter_email','question_id','question_label','answer_text','answer_number','answer_date','answer_time','answer_email','answer_url','selected_options']
    const lines = [header.join(',')]
    ;(data || []).forEach((r:any) => {
      lines.push([
        r.submission_id,
        r.submission_created_at,
        r.submitter_email || '',
        r.question_id,
        JSON.stringify(r.question_label||''),
        JSON.stringify(r.answer_text||''),
        r.answer_number ?? '',
        r.answer_date || '',
        r.answer_time || '',
        r.answer_email || '',
        r.answer_url || '',
        JSON.stringify(r.selected_options||[])
      ].join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'responses.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Responses</h1>
        <button className="px-3 py-2 border rounded" onClick={onExport}>Export CSV</button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Submission</th>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.submission_id} className="border-t">
                  <td className="p-2">{r.submission_id}</td>
                  <td className="p-2">{new Date(r.submission_created_at).toLocaleString()}</td>
                  <td className="p-2">{r.submitter_email || '-'}</td>
                  <td className="p-2">{r.status || 'complete'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={4}>No responses yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


