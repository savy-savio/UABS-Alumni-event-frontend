// Edit event content here.
export const EVENT = {
  title: 'Grand Alumni Launch Conference & Gala 2026',
  org: 'University of Abuja Business School Alumni Association',
  start: '2026-11-25T09:00:00+01:00',
  dateLabel: 'Wednesday, 25 November 2026',
  venue: 'NAF Conference Center, Kado, Abuja',
  format: 'Hybrid: attend in person or join online',
  theme: 'Thriving amid economic challenges: Transforming business and society through innovation, resilience and inclusive growth',
  hosts: [
    { name: 'Prof. Hakeem B. Fawehinmi', role: 'Vice-Chancellor, University of Abuja', tag: 'Chief Host' },
    { name: 'Prof. Munirat O. Yusuf-Habeeb', role: 'Director, UniAbuja Business School', tag: 'Host' },
    { name: 'Dr. Idoko Sunday Idoko', role: 'President, UABS Alumni Association', tag: 'Convener' },
  ],
  phones: ['08035516518', '08060904664'],
}

// One event, three moments
export const PROGRAMME = [
  { time: 'Morning', items: ['Grand Alumni Launch'] },
  { time: 'Mid day', items: ['Unveiling & Launch of the new UABS Campus Model', 'Awards to select personalities'] },
  { time: 'Evening', items: ['Gala and Award Night'] },
]

export const PROGRAMMES = ['MBA (Executive)', 'MBA (Regular)', 'DBA (Doctor of Business Administration)']

// Year of graduation options, newest first (2035 down to 1995). Adjust the range here if needed.
export const GRADUATION_YEARS = Array.from({ length: 2035 - 1995 + 1 }, (_, i) => String(2035 - i))