export interface MockJob {
  id: string
  title: string
  salary: string
  location: string
  skills: string[]
  posted: string
}

export interface MockCompany {
  id: string
  name: string
  logoPlaceholder: string
  coverColor: string
  industry: string
  size: string
  location: string
  country: string
  website: string
  rating: number
  reviewCount: number
  activeJobCount: number
  description: string
  benefits: string[]
  jobs: MockJob[]
  relatedIds: string[]
}

export const mockCompanies: MockCompany[] = [
  {
    id: 'innovatehub-vietnam',
    name: 'InnovateHub Vietnam',
    logoPlaceholder: 'IH',
    coverColor: '#e0e7ff',
    industry: 'AI/ML',
    size: '200-500',
    location: 'Hồ Chí Minh',
    country: 'Vietnam',
    website: 'innovatehub.vn',
    rating: 4.5,
    reviewCount: 45,
    activeJobCount: 12,
    description:
      'InnovateHub Vietnam is an AI-first product studio building cloud-native platforms for global markets. With 300+ engineers we focus on speed, quality and transparent engineering culture.',
    benefits: [
      'Remote-friendly 3 days/week',
      'Competitive market salary',
      '$500/year learning budget',
      'Small team, high ownership',
    ],
    jobs: [
      { id: 'senior-nodejs', title: 'Senior Node.js Backend Developer', salary: '$2,500 – $3,500', location: 'HCM (Hybrid)', skills: ['Node.js', 'TypeScript', 'AWS'], posted: '2 hours ago' },
      { id: 'frontend-react', title: 'Frontend Engineer (React)', salary: '$2,000 – $2,800', location: 'Remote', skills: ['React', 'Next.js', 'Tailwind'], posted: '6 hours ago' },
      { id: 'data-engineer', title: 'Data Engineer (Python/Spark)', salary: '$2,300 – $3,200', location: 'HCM (Onsite)', skills: ['Python', 'Spark', 'Airflow'], posted: '1 day ago' },
      { id: 'devops-aws', title: 'DevOps Engineer (AWS/Kubernetes)', salary: '$2,700 – $3,600', location: 'Remote', skills: ['Kubernetes', 'Terraform', 'AWS'], posted: '2 days ago' },
    ],
    relatedIds: ['byteforge', 'cloudbridge-tech', 'scaleone-labs', 'datanova-analytics'],
  },
  {
    id: 'byteforge',
    name: 'ByteForge',
    logoPlaceholder: 'BF',
    coverColor: '#e0f2fe',
    industry: 'Fintech',
    size: '50-200',
    location: 'Hà Nội',
    country: 'Vietnam',
    website: 'byteforge.io',
    rating: 4.3,
    reviewCount: 30,
    activeJobCount: 8,
    description:
      'Engineering-focused environment for high-load fintech products. We ship fast and care deeply about code quality.',
    benefits: [
      'Flexible hours',
      'Performance bonuses',
      'Modern tech stack',
      'Regular team offsites',
    ],
    jobs: [
      { id: 'backend-java', title: 'Backend Java Developer', salary: '$1,800 – $2,600', location: 'Hà Nội (Onsite)', skills: ['Java', 'Spring Boot', 'PostgreSQL'], posted: '1 day ago' },
      { id: 'mobile-android', title: 'Android Engineer', salary: '$1,600 – $2,400', location: 'Hà Nội (Hybrid)', skills: ['Kotlin', 'Jetpack Compose', 'Firebase'], posted: '3 days ago' },
    ],
    relatedIds: ['innovatehub-vietnam', 'scaleone-labs', 'cloudbridge-tech', 'pixelcraft-studio'],
  },
  {
    id: 'cloudbridge-tech',
    name: 'CloudBridge Tech',
    logoPlaceholder: 'CB',
    coverColor: '#dcfce7',
    industry: 'DevOps',
    size: '50-200',
    location: 'Remote',
    country: 'Vietnam',
    website: 'cloudbridge.tech',
    rating: 4.6,
    reviewCount: 52,
    activeJobCount: 16,
    description:
      'Remote-friendly team building data and DevOps tooling. We believe in async communication and documentation-first engineering.',
    benefits: [
      '100% remote',
      'USD salary',
      'Async-first culture',
      'Home office stipend $800',
    ],
    jobs: [
      { id: 'devops-k8s', title: 'DevOps Engineer (Kubernetes)', salary: '$2,700 – $3,600', location: 'Remote', skills: ['Kubernetes', 'Terraform', 'Prometheus'], posted: '2 days ago' },
      { id: 'sre', title: 'Site Reliability Engineer', salary: '$3,000 – $4,000', location: 'Remote', skills: ['Go', 'Prometheus', 'AWS'], posted: '4 days ago' },
    ],
    relatedIds: ['innovatehub-vietnam', 'byteforge', 'scaleone-labs', 'datanova-analytics'],
  },
  {
    id: 'scaleone-labs',
    name: 'ScaleOne Labs',
    logoPlaceholder: 'SO',
    coverColor: '#fef9c3',
    industry: 'SaaS',
    size: '50-200',
    location: 'Hồ Chí Minh',
    country: 'Vietnam',
    website: 'scaleonelabs.com',
    rating: 4.4,
    reviewCount: 38,
    activeJobCount: 10,
    description:
      'Fast-growth SaaS team with strong product engineering culture. We hire engineers who own their features end-to-end.',
    benefits: [
      'Equity options',
      'Unlimited PTO',
      'Conference budget',
      'Fast promotion track',
    ],
    jobs: [
      { id: 'engineering-manager', title: 'Engineering Manager', salary: '$4,000 – $5,500', location: 'Remote (APAC)', skills: ['Leadership', 'System Design', 'Agile'], posted: '4 days ago' },
      { id: 'fullstack-ts', title: 'Fullstack Engineer (TypeScript)', salary: '$2,200 – $3,000', location: 'HCM (Hybrid)', skills: ['TypeScript', 'React', 'Node.js'], posted: '5 days ago' },
    ],
    relatedIds: ['byteforge', 'cloudbridge-tech', 'innovatehub-vietnam', 'pixelcraft-studio'],
  },
  {
    id: 'datanova-analytics',
    name: 'DataNova Analytics',
    logoPlaceholder: 'DN',
    coverColor: '#fee2e2',
    industry: 'Data',
    size: '<50',
    location: 'Đà Nẵng',
    country: 'Vietnam',
    website: 'datanova.vn',
    rating: 4.2,
    reviewCount: 21,
    activeJobCount: 6,
    description:
      'Data-first analytics startup helping Vietnamese enterprises make sense of their data. Small team, big impact.',
    benefits: [
      'Equity for early team',
      'Flexible location',
      'Research-first culture',
      'Hardware budget',
    ],
    jobs: [
      { id: 'data-scientist', title: 'Data Scientist (NLP)', salary: '$1,800 – $2,800', location: 'Đà Nẵng (Hybrid)', skills: ['Python', 'PyTorch', 'Transformers'], posted: '3 days ago' },
    ],
    relatedIds: ['innovatehub-vietnam', 'cloudbridge-tech', 'scaleone-labs', 'byteforge'],
  },
  {
    id: 'pixelcraft-studio',
    name: 'PixelCraft Studio',
    logoPlaceholder: 'PC',
    coverColor: '#fce7f3',
    industry: 'Design',
    size: '<50',
    location: 'Hồ Chí Minh',
    country: 'Vietnam',
    website: 'pixelcraft.studio',
    rating: 4.1,
    reviewCount: 17,
    activeJobCount: 4,
    description:
      'Product design studio crafting digital experiences for startups and scale-ups across Southeast Asia.',
    benefits: [
      'Creative environment',
      'Figma Pro license',
      'Friday showcase',
      'Flexible hours',
    ],
    jobs: [
      { id: 'product-designer', title: 'Product Designer (UX/UI)', salary: '$1,600 – $2,400', location: 'HCM (Onsite)', skills: ['Figma', 'Design System', 'Research'], posted: '5 days ago' },
    ],
    relatedIds: ['scaleone-labs', 'byteforge', 'innovatehub-vietnam', 'cloudbridge-tech'],
  },
]

export function getCompanyById(id: string): MockCompany | undefined {
  return mockCompanies.find((c) => c.id === id)
}

export function getRelatedCompanies(company: MockCompany): MockCompany[] {
  return company.relatedIds
    .map((id) => mockCompanies.find((c) => c.id === id))
    .filter((c): c is MockCompany => c !== undefined)
    .slice(0, 4)
}

export const INDUSTRIES = ['AI/ML', 'Fintech', 'DevOps', 'SaaS', 'Data', 'Design']
export const SIZES = ['<50', '50-200', '200-500', '500+']
export const LOCATIONS = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Remote']
