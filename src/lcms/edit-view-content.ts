export interface IEditViewContent {
  activityId: string;
  fieldId: string;
  newContents: string;
  longEdit: boolean;
  attachments: string[];
  setActivityRead: boolean;
}

export interface IEditViewContentRelease {
  activityId: string;
  fieldId: string;
  type: 'FIELD';
}

export interface IEditViewContentLock extends IEditViewContentRelease {
  longEdit: boolean;
}
