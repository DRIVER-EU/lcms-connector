export interface IUserInfo {
  displayName: string;
  lastSeen: number;
  name: string;
  organizationId: string;
  currentProfile: ICurrentProfile;
  userAccess: {categories: string[]};
}

export interface ICurrentProfile {
  partnerProfile: boolean;
  id: string;
  organization: {id: string; code: string; name: string; displayName: string; partnerOrganization: boolean};
  team: {id: string; name: string; description: string};
  discipline: {id: string; name: string; description: string};
  function: {id: string; name: string; description: string};
  accessLevel: number;
  externalInformation: boolean;
  writer: boolean;
  restrictedToSummary: boolean;
  informationManager: boolean;
  templateManager: boolean;
  templateCreator: boolean;
  plotterAdvanced: boolean;
  flankCommandant: boolean;
  plotterBasic: boolean;
  longEdit: boolean;
  seeUsers: boolean;
  ownOrganizationRightsOnly: boolean;
  driveAssign: boolean;
  measureAssign: boolean;
  organizationContentManager: boolean;
  level: string;
}
