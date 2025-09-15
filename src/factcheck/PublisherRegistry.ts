export interface Publisher {
  id: string
  name: string
  weight: number
  region: string
  lang: string
  url?: string
  description?: string
  type: 'fact_checker' | 'news' | 'government' | 'academic' | 'international'
}

export const PUBLISHERS: Publisher[] = [
  // International Fact-Checkers
  {
    id: 'ifcn_generic',
    name: 'IFCN Network',
    weight: 1.0,
    region: 'global',
    lang: 'multi',
    url: 'https://www.poynter.org/ifcn/',
    description: 'International Fact-Checking Network',
    type: 'international'
  },
  {
    id: 'snopes',
    name: 'Snopes',
    weight: 0.95,
    region: 'global',
    lang: 'en',
    url: 'https://www.snopes.com/',
    description: 'Fact-checking website',
    type: 'fact_checker'
  },
  {
    id: 'factcheck_org',
    name: 'FactCheck.org',
    weight: 0.92,
    region: 'global',
    lang: 'en',
    url: 'https://www.factcheck.org/',
    description: 'Nonpartisan fact-checking organization',
    type: 'fact_checker'
  },

  // Bangladesh Fact-Checkers
  {
    id: 'rumorscanner_bd',
    name: 'Rumor Scanner Bangladesh',
    weight: 0.9,
    region: 'BD',
    lang: 'bn',
    url: 'https://www.rumorscanner.com/',
    description: 'Leading fact-checking organization in Bangladesh',
    type: 'fact_checker'
  },
  {
    id: 'factwatch_ulab',
    name: 'FactWatch (ULAB)',
    weight: 0.85,
    region: 'BD',
    lang: 'bn',
    url: 'https://factwatch.org/',
    description: 'University of Liberal Arts Bangladesh fact-checking initiative',
    type: 'academic'
  },
  {
    id: 'boom_bangladesh',
    name: 'BOOM Bangladesh',
    weight: 0.82,
    region: 'BD',
    lang: 'bn',
    url: 'https://www.boomlive.in/bangladesh',
    description: 'BOOM fact-checking for Bangladesh',
    type: 'fact_checker'
  },

  // Bangladesh News Sources
  {
    id: 'prothom_alo',
    name: 'Prothom Alo',
    weight: 0.88,
    region: 'BD',
    lang: 'bn',
    url: 'https://www.prothomalo.com/',
    description: 'Leading Bengali daily newspaper',
    type: 'news'
  },
  {
    id: 'daily_star',
    name: 'The Daily Star',
    weight: 0.86,
    region: 'BD',
    lang: 'en',
    url: 'https://www.thedailystar.net/',
    description: 'Leading English daily in Bangladesh',
    type: 'news'
  },
  {
    id: 'dhaka_tribune',
    name: 'Dhaka Tribune',
    weight: 0.83,
    region: 'BD',
    lang: 'en',
    url: 'https://www.dhakatribune.com/',
    description: 'English daily newspaper',
    type: 'news'
  },
  {
    id: 'bdnews24',
    name: 'bdnews24.com',
    weight: 0.81,
    region: 'BD',
    lang: 'multi',
    url: 'https://bdnews24.com/',
    description: 'Online news portal',
    type: 'news'
  },

  // Government Sources
  {
    id: 'bbs_gov_bd',
    name: 'Bangladesh Bureau of Statistics',
    weight: 0.95,
    region: 'BD',
    lang: 'multi',
    url: 'https://bbs.gov.bd/',
    description: 'Official statistics agency of Bangladesh',
    type: 'government'
  },
  {
    id: 'mof_gov_bd',
    name: 'Ministry of Finance, Bangladesh',
    weight: 0.92,
    region: 'BD',
    lang: 'multi',
    url: 'https://mof.gov.bd/',
    description: 'Ministry of Finance official website',
    type: 'government'
  },

  // International News Sources
  {
    id: 'bbc_bangla',
    name: 'BBC Bangla',
    weight: 0.94,
    region: 'BD',
    lang: 'bn',
    url: 'https://www.bbc.com/bangla',
    description: 'BBC Bengali service',
    type: 'international'
  },
  {
    id: 'dw_bangla',
    name: 'Deutsche Welle Bangla',
    weight: 0.89,
    region: 'BD',
    lang: 'bn',
    url: 'https://www.dw.com/bn',
    description: 'Deutsche Welle Bengali service',
    type: 'international'
  },
  {
    id: 'voa_bangla',
    name: 'Voice of America Bangla',
    weight: 0.87,
    region: 'BD',
    lang: 'bn',
    url: 'https://www.voabangla.com/',
    description: 'VOA Bengali service',
    type: 'international'
  },

  // Academic and Research
  {
    id: 'transparency_bd',
    name: 'Transparency International Bangladesh',
    weight: 0.88,
    region: 'BD',
    lang: 'multi',
    url: 'https://www.ti-bangladesh.org/',
    description: 'Anti-corruption organization',
    type: 'academic'
  },
  {
    id: 'cpd_bd',
    name: 'Centre for Policy Dialogue',
    weight: 0.85,
    region: 'BD',
    lang: 'multi',
    url: 'https://cpd.org.bd/',
    description: 'Policy research institute',
    type: 'academic'
  }
]

export class PublisherRegistry {
  private publishers: Map<string, Publisher>

  constructor() {
    this.publishers = new Map()
    PUBLISHERS.forEach(publisher => {
      this.publishers.set(publisher.id, publisher)
    })
  }

  getPublisher(id: string): Publisher | undefined {
    return this.publishers.get(id)
  }

  getPublishersByRegion(region: string): Publisher[] {
    return PUBLISHERS.filter(p => p.region === region || p.region === 'global')
  }

  getPublishersByLanguage(language: string): Publisher[] {
    return PUBLISHERS.filter(p => p.lang === language || p.lang === 'multi')
  }

  getPublishersByType(type: Publisher['type']): Publisher[] {
    return PUBLISHERS.filter(p => p.type === type)
  }

  getFactCheckers(region?: string, language?: string): Publisher[] {
    let factCheckers = PUBLISHERS.filter(p => 
      p.type === 'fact_checker' || p.type === 'international'
    )

    if (region) {
      factCheckers = factCheckers.filter(p => 
        p.region === region || p.region === 'global'
      )
    }

    if (language) {
      factCheckers = factCheckers.filter(p => 
        p.lang === language || p.lang === 'multi'
      )
    }

    return factCheckers.sort((a, b) => b.weight - a.weight)
  }

  getNewsSources(region?: string, language?: string): Publisher[] {
    let newsSources = PUBLISHERS.filter(p => 
      p.type === 'news' || p.type === 'international'
    )

    if (region) {
      newsSources = newsSources.filter(p => 
        p.region === region || p.region === 'global'
      )
    }

    if (language) {
      newsSources = newsSources.filter(p => 
        p.lang === language || p.lang === 'multi'
      )
    }

    return newsSources.sort((a, b) => b.weight - a.weight)
  }

  getGovernmentSources(region?: string): Publisher[] {
    let govSources = PUBLISHERS.filter(p => p.type === 'government')

    if (region) {
      govSources = govSources.filter(p => p.region === region)
    }

    return govSources.sort((a, b) => b.weight - a.weight)
  }

  getAllPublishers(): Publisher[] {
    return [...PUBLISHERS].sort((a, b) => b.weight - a.weight)
  }

  searchPublishers(query: string): Publisher[] {
    const lowerQuery = query.toLowerCase()
    return PUBLISHERS.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => b.weight - a.weight)
  }
}

// Export singleton instance
export const publisherRegistry = new PublisherRegistry()