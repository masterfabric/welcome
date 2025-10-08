"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { getFormBySlugPublic, getFormBySlugOwner, getFormQuestions, FormQuestion } from '@/lib/supabase/forms'
import { createSubmission, insertAnswers } from '@/lib/supabase/submissions'

export default function PublicFormPage() {
  const params = useParams() as { slug: string }
  const [form, setForm] = useState<any>(null)
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      let f: any = null
      const pub = await getFormBySlugPublic(params.slug)
      if (pub.data) f = pub.data
      if (!f) {
        const own = await getFormBySlugOwner(params.slug)
        if (own.data) f = own.data
      }
      if (!f) { setLoading(false); return }
      const qs = await getFormQuestions(f.id)
      if (mounted) {
        setForm(f)
        setQuestions(qs.data || [])
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [params.slug])

  const requiredQuestionIds = useMemo(() => new Set(questions.filter(q=>q.required).map(q=>q.id)), [questions])

  function buildAnswerPayload() {
    return questions.map(q => {
      const v = answers[q.id]
      if (q.type === 'multiple_choice' || q.type === 'dropdown') {
        return { question_id: q.id, selected_options: v ? [v] : [] }
      }
      if (q.type === 'checkboxes') {
        return { question_id: q.id, selected_options: Array.isArray(v) ? v : [] }
      }
      if (q.type === 'number') return { question_id: q.id, value_number: v != null && v !== '' ? Number(v) : null }
      if (q.type === 'date') return { question_id: q.id, value_date: v || null }
      if (q.type === 'time') return { question_id: q.id, value_time: v || null }
      if (q.type === 'email') return { question_id: q.id, value_email: v || null }
      if (q.type === 'url') return { question_id: q.id, value_url: v || null }
      if (q.type === 'file_upload') return { question_id: q.id, files: v || null }
      return { question_id: q.id, value_text: v || '' }
    })
  }

  function validateClient() {
    for (const q of questions) {
      if (q.required) {
        const v = answers[q.id]
        if (q.type === 'checkboxes') {
          if (!Array.isArray(v) || v.length === 0) return `Please answer: ${q.label}`
        } else if (v == null || v === '') {
          return `Please answer: ${q.label}`
        }
      }
    }
    if (!consent) return 'You must agree to GDPR consent.'
    return null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const clientErr = validateClient()
    if (clientErr) { setError(clientErr); return }
    setSubmitting(true)
    const ip = '0.0.0.0'
    const sub = await createSubmission({
      form_id: (form as any).id,
      consent_checked: consent,
      submitter_ip: ip,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    })
    if (sub.error || !sub.data) { setError(sub.error?.message || 'Submission failed'); setSubmitting(false); return }
    const payload = buildAnswerPayload()
    const ans = await insertAnswers(sub.data.id, payload)
    setSubmitting(false)
    if (ans.error) { setError(ans.error.message); return }
    setSubmitted(true)
  }

  if (loading) return <div className="p-4">Loading…</div>
  if (!form) return <div className="p-4">Form not found</div>
  if (submitted) return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      {form.confirmation_message ? (
        <p>{form.confirmation_message}</p>
      ) : (
        <p>Your response has been recorded.</p>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{form.title}</h1>
        {form.description && <p className="mt-1 text-gray-700">{form.description}</p>}
        <div className="mt-2 text-xs">{form.is_internal ? 'Internal Form' : 'Public Form'}</div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="space-y-1">
            <label className="block text-sm font-medium">{q.label}{q.required && ' *'}</label>
            {q.type === 'short_text' && (
              <input className="border rounded w-full px-3 py-2" maxLength={500} value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />
            )}
            {q.type === 'long_text' && (
              <textarea className="border rounded w-full px-3 py-2" maxLength={5000} rows={4} value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />
            )}
            {q.type === 'email' && (
              <input type="email" className="border rounded w-full px-3 py-2" value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />
            )}
            {q.type === 'url' && (
              <input type="url" className="border rounded w-full px-3 py-2" value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />
            )}
            {q.type === 'number' && (
              <input type="number" className="border rounded w-full px-3 py-2" value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />
            )}
            {q.type === 'date' && (
              <input type="date" className="border rounded w-full px-3 py-2" value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />
            )}
            {q.type === 'time' && (
              <input type="time" className="border rounded w-full px-3 py-2" value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />
            )}
            {q.type === 'multiple_choice' && (
              <div className="space-y-1">
                {(q.options||[]).map(o => (
                  <label key={o.id} className="flex items-center gap-2">
                    <input type="radio" name={q.id} value={o.value} checked={answers[q.id]===o.value} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'dropdown' && (
              <select className="border rounded w-full px-3 py-2" value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})}>
                <option value="">Select…</option>
                {(q.options||[]).map(o => (
                  <option key={o.id} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
            {q.type === 'checkboxes' && (
              <div className="space-y-1">
                {(q.options||[]).map(o => {
                  const list: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : []
                  const checked = list.includes(o.value)
                  return (
                    <label key={o.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={checked} onChange={(e)=>{
                        const next = new Set(list)
                        if (e.target.checked) next.add(o.value); else next.delete(o.value)
                        setAnswers({...answers, [q.id]: Array.from(next)})
                      }} />
                      <span>{o.label}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        ))}
        <div className="flex items-start gap-2">
          <input id="gdpr" type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
          <label htmlFor="gdpr" className="text-sm">{form.gdpr_consent_text}</label>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button type="submit" disabled={!consent || submitting} className="px-3 py-2 border rounded">{submitting ? 'Submitting…' : 'Submit'}</button>
      </form>
      <div className="text-xs text-gray-500">Form owner: {form.owner_user_id}</div>
      <div className="text-xs text-gray-500">Powered by MasterFabric Forms</div>
    </div>
  )
}


