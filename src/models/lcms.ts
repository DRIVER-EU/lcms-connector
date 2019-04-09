export interface ILCMSContent {
  tabTitle: string;
  fieldTitle: string;
  content: string;
}

export function createLCMSContent(tabTitle: string, fieldTitle: string, content: string = 'No content') {
  return {tabTitle: tabTitle, fieldTitle: fieldTitle, content: content} as ILCMSContent;
}

export interface IDisciplineField {
  id: string;
  name: string;
  description?: string;
}

export interface IDisciplineMap {
  disciplines: IDisciplineField[];
  functions: IDisciplineField[];
  organizations: IDisciplineField[];
  teams: IDisciplineField[];
}

export function findDisciplineId(name: string) {
  const x = displicineMap.disciplines.find(d => d.name === name);
  return x ? x.id : undefined;
}

export function findFunctionId(name: string) {
  const x = displicineMap.functions.find(d => d.name === name);
  return x ? x.id : undefined;
}

export function findOrganizationId(name: string) {
  const x = displicineMap.organizations.find(d => d.name === name);
  return x ? x.id : undefined;
}

export function findTeamId(name: string) {
  const x = displicineMap.teams.find(d => d.name === name);
  return x ? x.id : undefined;
}

export const displicineMap: IDisciplineMap = {
  disciplines: [
    {
      id: '3X6IWO060U902UMGX90KIJZRHZZOG8',
      name: 'BRW',
      description: 'Brandweerzorg'
    },
    {
      id: '3X6IWO066FX02UMGX9RWTVQ0KY04BL',
      name: 'BZ',
      description: 'Bevolkingszorg'
    },
    {
      id: '3X6IWO0BDDN02UMGX9RJ2SKOGRXDHO',
      name: 'CCOM',
      description: 'Crisiscommunicatie'
    },
    {
      id: '3X6IWO06VCB02UMGX9KUHLFCKE6Z40',
      name: 'DEF',
      description: 'Defensie'
    },
    {
      id: '3X6IWO06DCT02UMGX96CBNJN6KIEW5',
      name: 'GZ',
      description: 'Geneeskundige Zorg'
    },
    {
      id: '3X6IWO06EP502UMGX9IVV3Z2UX2BRN',
      name: 'MULTI',
      description: 'Multidisciplinair'
    },
    {
      id: '45A3GCXJ56Q02UMGX92B41RYRPUUT1',
      name: 'Orgbeheer',
      description: 'Orgbeheer'
    },
    {
      id: '3X6IWO06F5902UMGX9Z13WVVFPT4XY',
      name: 'POL',
      description: 'Politiezorg'
    }
  ],
  functions: [
    {
      id: '3X6IWO066D502UMGX9OYCCKNP8UFG2',
      name: 'AC',
      description: 'Algemeen Commandant'
    },
    {
      id: '3X6IWO08HSR02UMGX9XQG0FUON0ZFB',
      name: 'AGS',
      description: 'Adviseur Gevaarlijke Stoffen'
    },
    {
      id: '3X6IWO06NBF02UMGX91UN1IC20YE5W',
      name: 'CACO',
      description: 'Calamiteiten Coördinator'
    },
    {
      id: '3X6IWO06G2B02UMGX98TSWLQ18MF7J',
      name: 'FB',
      description: 'Regionaal Functioneel Beheerder'
    },
    {
      id: '3X6IWO06DOH02UMGX9QIYJHEAGBPE9',
      name: 'GAGS',
      description: 'Gezondheidskundig Adviseur Gevaarlijke Stoffen'
    },
    {
      id: '3X6IWO078MD02UMGX9DPB0HFC3XZR4',
      name: 'HBB',
      description: 'Hoofd Bewaken en Beveiligen'
    },
    {
      id: '3X6IWO07VH502UMGX9B3XHIQSNNXIX',
      name: 'HCOM',
      description: 'Hoofd Communicatie'
    },
    {
      id: '3X6IWO0M0DP02UMGX9Z4BP9BOTPYGI',
      name: 'HHN',
      description: 'Hoofd Handhaven Netwerken'
    },
    {
      id: '3X6IWO06W1B02UMGX946P1HAD5JTSH',
      name: 'HIN',
      description: 'Hoofd Informatie'
    },
    {
      id: '3X6IWO0M1DT02UMGX9J6G3VJ8HGZS3',
      name: 'HINT',
      description: 'Hoofd Interventie'
    },
    {
      id: '3X6IWO07A0X02UMGX9TPWUQTC4P51O',
      name: 'HMOB',
      description: 'Hoofd Mobiliteit'
    },
    {
      id: '3X6IWO07AKN02UMGX9G00KG79UB1IY',
      name: 'HOHA',
      description: 'Hoofd Ordehandhaving'
    },
    {
      id: '3X6IWO07B5R02UMGX9X5BNNPKZJOJL',
      name: 'HON',
      description: 'Hoofd Ondersteuning'
    },
    {
      id: '3X6IWO0NGRJ02UMGX9Q1Q0RAT3UB80',
      name: 'HOPEX',
      description: 'Hoofd Opsporingsexpertise'
    },
    {
      id: '3X6IWO07BLV02UMGX9BJRFO6PJP36W',
      name: 'HOPS',
      description: 'Hoofd Opsporing'
    },
    {
      id: '46NPA8XCLB8197HWGN4NI448MDXBIZ',
      name: 'HPACI',
      description: 'Hoofd Politie actiecentrum informatie'
    },
    {
      id: '3X6IWO068XN02UMGX9Z1E4CHHJF9XQ',
      name: 'IC',
      description: 'Informatiecoördinator'
    },
    {
      id: '3X6IWO06IOH02UMGX9J4OGYYPW1FPQ',
      name: 'IM',
      description: 'Informatiemanager'
    },
    {
      id: '3X6IWO09HQX02UMGX9ZJD5J2CFBSV5',
      name: 'MDW',
      description: 'Medewerker'
    },
    {
      id: '3X6IWO05YHJ02UMGX9LQ5C9DJ20QZR',
      name: 'MPL',
      description: 'Meetplanleider'
    },
    {
      id: '3X6IWO06I1P02UMGX9WYK0ON0AXJCY',
      name: 'OGA',
      description: 'Omgevingsanalist'
    },
    {
      id: '3X6IWO0ITJJ02UMGX9T93B9RWL00K8',
      name: 'OND',
      description: 'Ondersteuner'
    },
    {
      id: '3X6IWO06HBB02UMGX9AVKE2Q5A3T3F',
      name: 'OPL',
      description: 'Opleider / Trainer'
    },
    {
      id: '45A3GCXJ5S702UMGX97E2HAVBO3XN0',
      name: 'Orgbeheer',
      description: 'Orgbeheer'
    },
    {
      id: '3X6IWO06JEB02UMGX9MQWQ858LJYRM',
      name: 'PLOT',
      description: 'Plotter'
    },
    {
      id: '3X6IWO06MEN02UMGX9VEHYNERBGN0K',
      name: 'SEC',
      description: 'Secretaris'
    }
  ],
  organizations: [
    {
      id: '3X6IWNHQOLN02UMGX9UEXSYNGUZ3HP',
      name: 'VR015-Haaglanden'
    }
  ],
  teams: [
    {
      id: '3X6IWO05VXL02UMGX92IAUFSX3EDLQ',
      name: 'AC',
      description: 'Actiecentrum'
    },
    {
      id: '3X6IWO06FJZ02UMGX9Q2P0XIPVVJ1P',
      name: 'BEH',
      description: 'Regionaal Beheer'
    },
    {
      id: '3X6IWO069KF02UMGX9BN3OD4MYAS1K',
      name: 'COPI',
      description: 'Commando Plaats Incident'
    },
    {
      id: '3X6IWO06KQ302UMGX9CF21R9IYXZMY',
      name: 'GBT',
      description: 'Gemeentelijk Beleidsteam'
    },
    {
      id: '43OI99WVPWY1LO4UKNMMJGVSHW4AXN',
      name: 'KETEN',
      description: 'Keten partners'
    },
    {
      id: '3X6IWO06N9R02UMGX9CF3WTZIHBQIK',
      name: 'MK',
      description: 'Meldkamer'
    },
    {
      id: '3X6IWO06H8T02UMGX9UFW8SHSW9UE7',
      name: 'OTO',
      description: 'Opleiden, Trainen, Oefenen'
    },
    {
      id: '45A3GCXIWPJ02UMGX9I99XTQTFJGUU',
      name: 'Orgbeheer',
      description: 'Orgbeheer'
    },
    {
      id: '3X6IWO0KANR02UMGX9O0EA2KBGZFHK',
      name: 'PREP',
      description: 'Preparatie'
    },
    {
      id: '3X6IWO06RWP02UMGX9I1RA2PPY73JQ',
      name: 'RBT',
      description: 'Regionaal Beleidsteam'
    },
    {
      id: '3X6IWO06TC302UMGX9U44T4HKKYYRR',
      name: 'ROT',
      description: 'Regionaal Operationeel Team'
    },
    {
      id: '3X6IWO076H502UMGX9OJSMQB0WJBKB',
      name: 'SGBO',
      description: 'Staf Grootschalig Bijzonder Optreden'
    },
    {
      id: '41PV3E1K3P41LO4UKND8WBFOXYPHOW',
      name: 'TBZ',
      description: 'Lokale Teams Bevolkingszorg'
    },
    {
      id: '47CW5UZT0SW0PKQ0GLYDHGOSADO2T9',
      name: 'TO',
      description: 'Taakorganisatie'
    }
  ]
};
