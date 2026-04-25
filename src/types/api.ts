
export type ErrorResponse = {
  message?: string;
};

export type Paged<T> = {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
};

export type County = {
  countyId: number;
  countyName: string;
};

export type Country = {
  countryName: string;
  affectedCounties: County[];
};

export type Threat = {
  threatId: string;
  threatNumber: number;
  type: string;
  severity: string;
  affectedCountries: Country[];
  range: string;
  periodStart: string;
  periodEnd: string;
  active: boolean;
  notes: string;
};

export type Broadcast = {
  broadcastId: string;
  broadcastNumber: number;
  threatId: string;
  title: string;
  status: string;
  notes: string;
  channelType: string;
  primaryLangMessage: string;
  secondaryLangMessage: string;
  countryId: number;
  countryName: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  initiated: string;
  createdBy: string;
  affectedCounties: County[];
};

export type Dashboard = {
  threats: {
    activeThreatsCount: number;
    highPriorityCount: number;
  };
  broadcasts: {
    sentCount: number;
    pendingCount: number;
  };
  feedbacks: {
    receivedCount: number;
    todayCount: number;
  };
};

export type UserCountry = {
  countryId: number;
  name: string;
};

export type User = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  userUUID: string;
  country: UserCountry;
};

export type MifosUser = {
  username: string;
  userId: number;
  base64EncodedAuthenticationKey: string;
  officeId: number;
  officeName: string;
};

export type AuthResponse = {
  id_token: string;
};

export type Log = {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  processed: boolean;
  broadcast: string;
  timestamp: string;
};

export type InitiatedTransaction = {
  payeeIdentity: string;
  correlationId: string;
  /** Batch id from submit response `PollingPath` (e.g. `/batch/Summary/<uuid>`). */
  batchId?: string;
  payeeMsisdn?: string;
  payee: string;
  duration: number; // in seconds or ms, your choice
  executionDate: string; // ISO string or Date
  fromBank: string;
  toBank: string;
  fxRateToUSD: number;
  fxRateToZar: number;
  transactionFee: number;
  amountSent: number;
  amountReceived: number;
  status: string;
};

export type Beneficiary = {
// === MIFOS PAYMENT SETUP (RegisterBeneficiary API) 🔗 ===
  payeeIdentity: string;
  paymentModality: string;
  bankingInstitutionCode: string;
  financialAddress: string;

// === PERSONAL INFORMATION ===
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O';
  nationality: string;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';

// === IDENTITY DOCUMENTS ===
  primaryDocumentType: string;
  primaryDocumentNumber: string;
  primaryDocumentCountry: string;
  primaryDocumentExpiry: string;
  secondaryDocumentType?: string;
  secondaryDocumentNumber?: string;
  taxIdentificationNumber: string;

// === CONTACT INFORMATION ===
  phoneNumberPrimary: string;
  phoneNumberSecondary?: string;
  emailAddressPrimary: string;
  emailAddressSecondary?: string;
  preferredContactMethod: 'EMAIL' | 'PHONE' | string;
  languagePreference: string;

  // === CURRENT ADDRESS ===
  currentAddressLine1: string;
  currentAddressLine2?: string;
  currentCity: string;
  currentStateProvince: string;
  currentPostalCode: string;
  currentCountry: string;

// === HOME ADDRESS ===
  homeAddressLine1: string;
  homeAddressLine2?: string;
  homeCity: string;
  homeStateProvince: string;
  homePostalCode: string;
  homeCountry: string;

// === EMERGENCY CONTACT ===  
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  emergencyContactAddress: string;

// === PAYMENT DETAILS ===
  monthlyPensionAmount: number;
  currencyPreference: string;
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  bankName: string;
  bankBranch: string;
  accountHolderName: string;

 // === PENSION INFORMATION ===
  pensionStartDate: string;
  lastEmploymentDate: string;
  pensionType: string;
  serviceYears: number;
  lastReviewDate: string;
  nextReviewDate: string;

// === CROSS-BORDER & COMPLIANCE ===
  emigrationDate: string;
  residencePermitNumber: string;
  residencePermitExpiry: string;
  taxTreatyApplicable: boolean;
  withholdingTaxRate: number;
  complianceStatus: string;
  lastVerificationDate: string;

 // === SYSTEM FIELDS ===
  createdBy: string;
  createdDate: string;
  updatedBy?: string | null;
  updatedDate?: string | null;
  version: number;
}