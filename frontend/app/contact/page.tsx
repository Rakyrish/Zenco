'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Phone, Mail, MapPin, MessageSquare, Clock, Send, CheckCircle, ShieldAlert, MessageCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { submitInquiry } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/constants'
import { whatsappHref } from '@/components/products/product-helpers'

const schema = z.object({
  full_name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().min(2, 'Please specify your country'),
  inquiry_type: z.enum(['general', 'product', 'quote', 'partnership', 'technical']),
  product_interest: z.string().optional(),
  quantity: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormData = z.infer<typeof schema>

function ContactContent() {
  const searchParams = useSearchParams()
  const initialType = (searchParams.get('type') as any) || 'general'
  const initialProduct = searchParams.get('product') || ''

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      inquiry_type: initialType,
      product_interest: initialProduct,
      country: SITE_CONFIG.address.country,
    },
  })

  const selectedType = watch('inquiry_type')

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError(null)
    try {
      await submitInquiry(data)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="container-xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="section-tag">Get in Touch</span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">Contact Chemical Division</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Ready to order or need support? Fill out the form below or use our contact details to talk to our sales agents.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={whatsappHref(initialProduct ? {
                name: initialProduct,
                slug: '',
                category_name: 'Product inquiry',
              } : undefined, 'contact page inquiry')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-md bg-green-600 px-5 text-sm font-black text-white hover:bg-green-700 sm:w-auto"
            >
              <MessageCircle size={18} />
              WhatsApp Sales Directly
            </a>
            {SITE_CONFIG.phone && (
              <a href={`tel:${SITE_CONFIG.phone}`} className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-md border border-primary/20 bg-white px-5 text-sm font-black text-primary hover:bg-primary hover:text-white sm:w-auto">
                <Phone size={18} />
                Call Sales
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-card space-y-6">
              <h2 className="text-lg font-bold text-primary mb-2">Corporate Contacts</h2>

              <div className="space-y-4">
                <a href={`tel:${SITE_CONFIG.phone}`} className="flex items-start gap-3 hover:text-accent transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-accent/10 group-hover:text-accent transition-all flex-shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Call Us</p>
                    <p className="text-sm font-semibold">{SITE_CONFIG.phone}</p>
                  </div>
                </a>

                <a href={`mailto:${SITE_CONFIG.email}`} className="flex items-start gap-3 hover:text-accent transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-accent/10 group-hover:text-accent transition-all flex-shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Us</p>
                    <p className="text-sm font-semibold">{SITE_CONFIG.email}</p>
                  </div>
                </a>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Visit Depot</p>
                    <p className="text-sm font-semibold text-gray-600 leading-relaxed">
                      {SITE_CONFIG.address.street}, {SITE_CONFIG.address.city}, {SITE_CONFIG.address.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Opening Hours</p>
                    <p className="text-sm font-semibold text-gray-600 leading-relaxed">
                      {SITE_CONFIG.openingHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-card aspect-video relative">
              {SITE_CONFIG.mapEmbed ? (
                <iframe
                  title={`${SITE_CONFIG.name} Depot Location`}
                  src={SITE_CONFIG.mapEmbed}
                  className="absolute inset-0 w-full h-full border-none"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full min-h-48 flex-col items-center justify-center p-6 text-center">
                  <MapPin size={28} className="text-accent" />
                  <p className="mt-3 text-sm font-bold text-primary">{SITE_CONFIG.address.city || 'Main office'}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {SITE_CONFIG.address.street}, {SITE_CONFIG.address.country}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 p-8 shadow-card">
            {submitted ? (
              <div className="text-center py-12 space-y-4 max-w-md mx-auto">
                <CheckCircle size={56} className="text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-primary">Inquiry Submitted Successfully</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Thank you for reaching out. We have logged your request. A confirmation email has been dispatched, and our account manager will follow up within <strong>24 business hours</strong>.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-primary mt-4"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-accent" />
                  Lead & Quote Request Form
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      {...register('full_name')}
                      placeholder="Jane Doe"
                      className="form-input"
                    />
                    {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="form-label">Corporate Email Address *</label>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="jane.doe@company.com"
                      className="form-input"
                    />
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="+254 700 000 000"
                      className="form-input"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      {...register('company')}
                      placeholder="Acme Industrial Ltd"
                      className="form-input"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="form-label">Country *</label>
                    <input
                      type="text"
                      {...register('country')}
                      className="form-input"
                    />
                    {errors.country && <p className="form-error">{errors.country.message}</p>}
                  </div>

                  {/* Inquiry Type */}
                  <div>
                    <label className="form-label">Inquiry Type *</label>
                    <select {...register('inquiry_type')} className="form-input">
                      <option value="general">General Inquiry</option>
                      <option value="product">Product Specification</option>
                      <option value="quote">Request for Quote</option>
                      <option value="partnership">Distribution / Partnership</option>
                      <option value="technical">Technical Support</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Fields for Product/Quote */}
                {(selectedType === 'quote' || selectedType === 'product') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 animate-fade-in">
                    <div>
                      <label className="form-label">Product of Interest</label>
                      <input
                        type="text"
                        {...register('product_interest')}
                        placeholder="e.g. Sodium Hypochlorite 15%"
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Estimated Volume / Quantity Required</label>
                      <input
                        type="text"
                        {...register('quantity')}
                        placeholder="e.g. 5,000 Liters / IBC bulk"
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="form-label">Message *</label>
                  <textarea
                    {...register('message')}
                    rows={5}
                    placeholder="Describe your requirements or specific applications details…"
                    className="form-input resize-none"
                  />
                  {errors.message && <p className="form-error">{errors.message.message}</p>}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 border border-red-100">
                    <ShieldAlert size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary btn-lg w-full flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting…' : 'Submit Inquiry'}
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin text-accent text-3xl">⚗</div>
      </div>
    }>
      <ContactContent />
    </Suspense>
  )
}
