"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getFormQuestions, updateForm, addQuestion, addQuestionOption, updateQuestion } from '@/lib/supabase/forms'
import { supabase } from '@/lib/supabase/client'

export default function EditFormPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [form, setForm] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: formData } = await supabase.from('forms').select('*').eq('id', params.id).single()
      const { data: qs } = await getFormQuestions(params.id)
      if (mounted) {
        setForm(formData)
        setQuestions(qs || [])
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [params.id])

  async function onMetaSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await updateForm(form.id, {
      title: form.title,
      description: form.description,
      is_internal: form.is_internal,
      status: form.status,
      confirmation_message: form.confirmation_message,
      redirect_url: form.redirect_url,
      submission_limit: form.submission_limit,
      start_at: form.start_at,
      end_at: form.end_at,
      email_notify_on_new_response: form.email_notify_on_new_response,
      email_summary_frequency: form.email_summary_frequency,
      collect_submitter_email: form.collect_submitter_email
    } as any)
    setSaving(false)
    if (error) alert(error.message)
    if (data) setForm(data)
  }

  async function onAddQuestion(type: any) {
    const { data, error } = await addQuestion(form.id, { type, label: 'Untitled question', order_index: questions.length })
    if (error) { alert(error.message); return }
    if (data) setQuestions(prev => [...prev, data])
  }

  async function onAddOption(qId: string) {
    const q = questions.find(q => q.id === qId)
    const { data, error } = await addQuestionOption(qId, { label: `Option ${(q?.options?.length || 0) + 1}` })
    if (error) { alert(error.message); return }
    setQuestions(prev => prev.map(item => item.id === qId ? { ...item, options: [...(item.options||[]), data] } : item))
  }

  if (loading) return <div className="p-4">Loading…</div>
  if (!form) return <div className="p-4">Form not found</div>

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Form</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={() => router.push(`/f/${form.slug}`)}>Preview</button>
          <button className="px-3 py-2 border rounded" onClick={() => router.push('/forms')}>Back</button>
        </div>
      </div>

      <form onSubmit={onMetaSave} className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="border rounded w-full px-3 py-2" value={form.title || ''} onChange={e=>setForm((f:any)=>({...f, title:e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="border rounded w-full px-3 py-2" value={form.description||''} onChange={e=>setForm((f:any)=>({...f, description:e.target.value}))} rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <input id="internal" type="checkbox" checked={!!form.is_internal} onChange={e=>setForm((f:any)=>({...f, is_internal:e.target.checked}))} />
            <label htmlFor="internal">Internal Only</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="border rounded w-full px-3 py-2" value={form.status} onChange={e=>setForm((f:any)=>({...f, status:e.target.value}))}>
              <option value="inactive">Inactive</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Start At</label>
              <input type="datetime-local" className="border rounded w-full px-3 py-2" value={form.start_at ? new Date(form.start_at).toISOString().slice(0,16) : ''} onChange={e=>setForm((f:any)=>({...f, start_at:e.target.value ? new Date(e.target.value).toISOString() : null}))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End At</label>
              <input type="datetime-local" className="border rounded w-full px-3 py-2" value={form.end_at ? new Date(form.end_at).toISOString().slice(0,16) : ''} onChange={e=>setForm((f:any)=>({...f, end_at:e.target.value ? new Date(e.target.value).toISOString() : null}))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Submission Limit</label>
            <input type="number" min={1} className="border rounded w-full px-3 py-2" value={form.submission_limit||''} onChange={e=>setForm((f:any)=>({...f, submission_limit:e.target.value ? Number(e.target.value) : null}))} />
          </div>
          <div className="flex items-center gap-2">
            <input id="notify" type="checkbox" checked={!!form.email_notify_on_new_response} onChange={e=>setForm((f:any)=>({...f, email_notify_on_new_response:e.target.checked}))} />
            <label htmlFor="notify">Email notify on new response</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Summary Frequency</label>
            <select className="border rounded w-full px-3 py-2" value={form.email_summary_frequency||'none'} onChange={e=>setForm((f:any)=>({...f, email_summary_frequency:e.target.value}))}>
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="collect" type="checkbox" checked={!!form.collect_submitter_email} onChange={e=>setForm((f:any)=>({...f, collect_submitter_email:e.target.checked}))} />
            <label htmlFor="collect">Collect submitter email</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-2 border rounded" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Questions</h2>
            <div className="flex gap-2">
              <select id="add-type" className="border rounded px-2 py-1" onChange={()=>{}} defaultValue="">
                <option value="" disabled>Choose type</option>
                <option value="short_text">Short Text</option>
                <option value="long_text">Long Text</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="checkboxes">Checkboxes</option>
                <option value="dropdown">Dropdown</option>
                <option value="url">Link/URL</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="file_upload">File Upload</option>
              </select>
              <button className="px-3 py-2 border rounded" onClick={() => {
                const sel = (document.getElementById('add-type') as HTMLSelectElement)
                if (!sel || !sel.value) return
                onAddQuestion(sel.value)
                sel.value = ''
              }}>Add Question</button>
            </div>
          </div>
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-500">{q.type}</span>
                </div>
                <input className="mt-2 border rounded w-full px-3 py-2" value={q.label} onChange={e=>setQuestions(prev=>prev.map(i=>i.id===q.id?{...i,label:e.target.value}:i))} onBlur={async()=>{
                  const cur = questions.find(i=>i.id===q.id)
                  if (cur) await updateQuestion(q.id, { label: cur.label })
                }} />
                <div className="mt-2 flex items-center gap-2">
                  <input id={`req-${q.id}`} type="checkbox" checked={!!q.required} onChange={async e=>{
                    const checked = e.target.checked
                    setQuestions(prev=>prev.map(i=>i.id===q.id?{...i,required:checked}:i))
                    await updateQuestion(q.id, { required: checked })
                  }} />
                  <label htmlFor={`req-${q.id}`}>Required</label>
                </div>
                {['multiple_choice','checkboxes','dropdown'].includes(q.type) && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Options</span>
                      <button className="px-2 py-1 border rounded text-sm" onClick={() => onAddOption(q.id)}>Add option</button>
                    </div>
                    <ul className="space-y-1">
                      {(q.options||[]).map((o:any) => (
                        <li key={o.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{o.order_index+1}.</span>
                          <span>{o.label}</span>
                        </li>
                      ))}
                      {(q.options||[]).length === 0 && <li className="text-xs text-gray-500">No options yet</li>}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {questions.length === 0 && (
              <div className="text-sm text-gray-500">No questions yet. Add your first question.</div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}


