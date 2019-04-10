export type LCMSPriorities = 'LOW' | 'AVERAGE' | 'HIGH' | 'URGENT';

export interface ICAPAction {
  title: string;
  description: string;
  priority: LCMSPriorities;
  organisation: string;
  team: string;
  discipline: string;
  function: string;
}

export interface IActionOperation {
  operation: 'CREATE_ACTION' | 'GET_ACTIONS';
  data: ICreateActionOperationData | IGetActionOperationData;
}

export interface ICreateActionOperationData {
  actionTaker: IActionTaker;
  activityId: string;
  description: string;
  summary: string;
  priority: LCMSPriorities;
}

export interface IActionTaker {
  organizationId: string;
  functionId: string;
  teamId: string;
  disciplineId: string;
}

export interface IGetActionOperationData {
  numberOfRecords: number;
  activityId: string;
  filtering: IActionFiltering;
  orderBy: string[];
}

export interface IActionFiltering {
  statuses: string[];
  actionGiverIds: string[];
  actionTakerIds: string[];
  actionGiverTakerFilterType: string;
}
