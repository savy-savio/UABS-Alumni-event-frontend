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

// Executive Council. Add or change a photo by putting the file in public/team/
// and setting `photo` (e.g. '/team/president.jpg'). Leave `photo: null` to show a placeholder.
export const COUNCIL = [
  { role: 'President', name: 'Idoko Sunday Idoko', photo: '/team/president.jpeg' },
  { role: 'Vice President', name: 'Zainab Ndana', photo: '/team/vice-president.jpeg' },
  { role: 'Secretary General', name: 'Uzomba Chinonso Shedrach', photo: '/team/secretary-general.jpg' },
  { role: 'Treasurer', name: 'Anyaegbu Chiamaka Mary-Rose', photo: '/team/treasurer.jpg' },
  { role: 'Financial Secretary', name: 'Dr. Luka Joshua Izang ACTI, FCPA, FCA', photo: '/team/financial-secretary.jpg' },
  { role: 'Director of Events', name: 'ESV. Bivan E. Adams (ANIVS)', photo: '/team/director-events.jpg' },
  { role: 'Social Media Manager', name: 'Deborah Balat', photo: '/team/social-media-manager.jpg' },
  { role: 'Director of Communications', name: 'Bertha E. Ogbimi', photo: '/team/director-communications.jpg' },
  { role: 'Director of Admissions/Careers', name: 'Sani Ericson', photo: '/team/director-admissions-careers.jpg' },
  { role: 'Director of Alumni Engagement', name: 'Oji Aso I.', photo: '/team/director-alumni-engagement.jpg' },
  { role: 'Director of Development', name: 'Ogbuefi Izuchukwu Stephen', photo: '/team/director-development.jpg' },
  { role: 'Director of Linkages and Exchange Programme', name: 'Mercy Mustapha Igene', photo: '/team/director-linkages-exchange.jpg' },
]