import { supabase } from './client'

export interface Submission {
  id: string
  form_id: string
  created_at: string
  completed_at: string | null
  status: 'complete' | 'incomplete'
  submitter_user_id?: string | null
  submitter_email?: string | null
  submitter_ip: string
  user_agent?: string | null
  consent_checked: boolean
  consent_text_snapshot: string
  rejected_reason?: string | null
}

export interface AnswerPayload {
  question_id: string
  value_text?: string | null
  value_json?: any
  value_number?: number | null
  value_date?: string | null
  value_time?: string | null
  value_email?: string | null
  value_url?: string | null
  selected_options?: string[] | null
  files?: any
}

export async function createSubmission(params: {
  form_id: string
  consent_checked: boolean
  submitter_ip: string
  user_agent?: string
  submitter_email?: string
}) {
  const payload: any = {
    form_id: params.form_id,
    consent_checked: params.consent_checked,
    consent_text_snapshot: '', // filled by trigger
    submitter_ip: params.submitter_ip,
    user_agent: params.user_agent || null,
    submitter_email: params.submitter_email || null
  }

  const { data, error } = await supabase
    .from('form_submissions')
    .insert(payload)
    .select('*')
    .single()
  if (error) return { data: null, error }
  return { data: data as Submission, error: null }
}

export async function insertAnswers(submission_id: string, answers: AnswerPayload[]) {
  if (!answers || answers.length === 0) return { data: [], error: null }
  const rows = answers.map((a) => ({ submission_id, ...a }))
  const { data, error } = await supabase
    .from('form_answers')
    .insert(rows)
    .select('*')
  if (error) return { data: null, error }
  return { data, error: null }
}

export async function listResponsesForOwner(form_id: string) {
  const { data, error } = await supabase
    .from('form_responses_owner_view')
    .select('*')
    .eq('form_id', form_id)
    .order('submission_created_at', { ascending: false })
  if (error) return { data: null, error }
  return { data, error: null }
}

export async function exportResponses(form_id: string) {
  const { data, error } = await supabase.rpc('export_form_responses', { p_form_id: form_id })
  if (error) return { data: null, error }
  return { data, error: null }
}


