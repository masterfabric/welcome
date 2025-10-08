import { supabase } from './client'

export type FormStatus = 'active' | 'inactive' | 'closed'
export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'url'
  | 'date'
  | 'time'
  | 'email'
  | 'number'
  | 'file_upload'

export interface Form {
  id: string
  created_at: string
  updated_at: string
  created_by: string
  owner_user_id: string
  title: string
  description?: string | null
  slug: string
  is_internal: boolean
  status: FormStatus
  gdpr_consent_text: string
  submission_limit?: number | null
  start_at?: string | null
  end_at?: string | null
  confirmation_message?: string | null
  redirect_url?: string | null
  email_notify_on_new_response: boolean
  email_summary_frequency: 'none' | 'daily' | 'weekly'
  collect_submitter_email: boolean
}

export interface FormQuestionOption {
  id: string
  question_id: string
  order_index: number
  label: string
  value: string
  is_other: boolean
}

export interface FormQuestion {
  id: string
  form_id: string
  created_at: string
  updated_at: string
  order_index: number
  type: QuestionType
  label: string
  description?: string | null
  required: boolean
  settings: any
  is_active: boolean
  options?: FormQuestionOption[]
}

export interface OwnerDashboardItem {
  id: string
  title: string
  slug: string
  status: FormStatus
  access_type: 'Internal' | 'Public'
  response_count: number
  created_at: string
  updated_at: string
  last_submission_at: string | null
}

export async function createForm(input: Partial<Form>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  // Prefer secure RPC to avoid client-side RLS friction
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_form_secure', {
    p_title: input.title,
    p_description: input.description ?? null,
    p_slug: input.slug,
    p_is_internal: input.is_internal ?? true,
    p_gdpr: input.gdpr_consent_text ?? 'I agree to the processing of my personal data in accordance with GDPR regulations and the company\'s privacy policy'
  })
  if (!rpcError && rpcData) return { data: rpcData as Form, error: null }

  // Fallback to direct insert if RPC is not available
  const payload = {
    created_by: user.id,
    owner_user_id: user.id,
    title: input.title,
    description: input.description ?? null,
    slug: input.slug,
    is_internal: input.is_internal ?? true,
    status: (input.status as FormStatus) ?? 'inactive',
    gdpr_consent_text: input.gdpr_consent_text ?? 'I agree to the processing of my personal data in accordance with GDPR regulations and the company\'s privacy policy',
    submission_limit: input.submission_limit ?? null,
    start_at: input.start_at ?? null,
    end_at: input.end_at ?? null,
    confirmation_message: input.confirmation_message ?? null,
    redirect_url: input.redirect_url ?? null,
    email_notify_on_new_response: input.email_notify_on_new_response ?? false,
    email_summary_frequency: (input.email_summary_frequency as any) ?? 'none',
    collect_submitter_email: input.collect_submitter_email ?? false
  }
  const { data, error } = await supabase.from('forms').insert(payload).select('*').single()
  if (error) return { data: null, error: rpcError || error }
  return { data: data as Form, error: null }
}

export async function updateForm(id: string, updates: Partial<Form>) {
  const { data, error } = await supabase
    .from('forms')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return { data: null, error }
  return { data: data as Form, error: null }
}

export async function getFormBySlugPublic(slug: string) {
  const { data, error } = await supabase
    .from('forms_public_view')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) return { data: null, error }
  return { data: data as Form | null, error: null }
}

export async function getFormBySlugOwner(slug: string) {
  // Owner can select from base table due to RLS
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) return { data: null, error }
  return { data: data as Form | null, error: null }
}

export async function getFormQuestions(formId: string) {
  const { data: questions, error } = await supabase
    .from('form_questions')
    .select('*')
    .eq('form_id', formId)
    .order('order_index', { ascending: true })
  if (error) return { data: null, error }

  const qIds = (questions || []).map((q: any) => q.id)
  if (qIds.length === 0) return { data: (questions || []) as FormQuestion[], error: null }

  const { data: options, error: optErr } = await supabase
    .from('form_question_options')
    .select('*')
    .in('question_id', qIds as string[])
    .order('order_index', { ascending: true })
  if (optErr) return { data: null, error: optErr }

  const optionsByQ = new Map<string, FormQuestionOption[]>()
  ;(options || []).forEach((o: any) => {
    const prev = optionsByQ.get(o.question_id) || []
    optionsByQ.set(o.question_id, [...prev, o])
  })

  const merged = (questions || []).map((q: any) => ({
    ...q,
    options: optionsByQ.get(q.id) || []
  })) as FormQuestion[]
  return { data: merged, error: null }
}

export async function listMyForms() {
  // Owner dashboard view enforces owner via auth
  const { data, error } = await supabase
    .from('forms_owner_dashboard')
    .select('*')
    .order('updated_at', { ascending: false })
  if (!error && data && data.length > 0) return { data: data as OwnerDashboardItem[], error: null }

  // Fallback: direct query on forms if the view is unavailable or returns empty
  const { data: me } = await supabase.auth.getUser()
  const userId = me?.user?.id
  if (!userId) return { data: [], error: null }

  const { data: raw, error: rawErr } = await supabase
    .from('forms')
    .select('*')
    .eq('owner_user_id', userId)
    .order('updated_at', { ascending: false })
  if (rawErr) return { data: null, error: rawErr }
  const mapped: OwnerDashboardItem[] = (raw || []).map((f: any) => ({
    id: f.id,
    title: f.title,
    slug: f.slug,
    status: f.status,
    access_type: f.is_internal ? 'Internal' : 'Public',
    response_count: 0,
    created_at: f.created_at,
    updated_at: f.updated_at,
    last_submission_at: null
  }))
  return { data: mapped, error: null }
}

export async function deleteForm(id: string) {
  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id)
  return { error: error || null }
}

export async function duplicateForm(id: string) {
  const { data, error } = await supabase.rpc('duplicate_form', { p_form_id: id })
  if (error) return { data: null, error }
  return { data: data as string, error: null }
}

export async function addQuestion(formId: string, input: Partial<FormQuestion>) {
  const payload: any = {
    form_id: formId,
    order_index: input.order_index ?? 0,
    type: input.type,
    label: input.label,
    description: input.description ?? null,
    required: input.required ?? false,
    settings: input.settings ?? {},
    is_active: input.is_active ?? true
  }
  const { data, error } = await supabase
    .from('form_questions')
    .insert(payload)
    .select('*')
    .single()
  if (error) return { data: null, error }
  return { data: data as FormQuestion, error: null }
}

export async function addQuestionOption(questionId: string, input: Partial<FormQuestionOption>) {
  const payload: any = {
    question_id: questionId,
    order_index: input.order_index ?? 0,
    label: input.label,
    value: input.value ?? (input.label || ''),
    is_other: input.is_other ?? false
  }
  const { data, error } = await supabase
    .from('form_question_options')
    .insert(payload)
    .select('*')
    .single()
  if (error) return { data: null, error }
  return { data: data as FormQuestionOption, error: null }
}

export async function updateQuestion(questionId: string, updates: Partial<FormQuestion>) {
  const payload: any = {}
  if (typeof updates.label !== 'undefined') payload.label = updates.label
  if (typeof updates.required !== 'undefined') payload.required = updates.required
  if (typeof updates.description !== 'undefined') payload.description = updates.description
  if (typeof updates.order_index !== 'undefined') payload.order_index = updates.order_index
  if (typeof updates.settings !== 'undefined') payload.settings = updates.settings
  if (typeof updates.is_active !== 'undefined') payload.is_active = updates.is_active
  const { data, error } = await supabase
    .from('form_questions')
    .update(payload)
    .eq('id', questionId)
    .select('*')
    .single()
  if (error) return { data: null, error }
  return { data, error: null }
}


