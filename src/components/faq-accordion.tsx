'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import ChevronIcon from '@/svgs/chevron.svg'

interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  type?: 'recharge' | 'withdraw'
}

export default function FaqAccordion({ type = 'recharge' }: FaqAccordionProps) {
  const t = useTranslations(`${type}.faq`)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqItems: FaqItem[] = [
    {
      question: t('q1.question'),
      answer: t('q1.answer')
    },
    {
      question: t('q2.question'),
      answer: t('q2.answer')
    },
    {
      question: t('q3.question'),
      answer: t('q3.answer')
    }
  ]

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className='flex flex-col gap-3'>
      {faqItems.map((item, index) => (
        <div key={index} className='flex flex-col gap-2 rounded-lg border border-border px-4 py-2'>
          <button
            onClick={() => toggleFaq(index)}
            className='flex items-center justify-between gap-[10px]'>
            <span className='flex-1 text-left text-sm font-medium leading-[21px] text-white/80'>{item.question}</span>
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center transition-transform ${openIndex === index ? 'rotate-180' : ''
                }`}>
              <ChevronIcon className='h-5 w-5 text-secondary' />
            </div>
          </button>

          {openIndex === index && (
            <div className='whitespace-pre-line text-xs font-medium leading-[21px] text-white/50'>
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

