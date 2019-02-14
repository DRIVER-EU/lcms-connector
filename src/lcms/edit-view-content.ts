export interface IEditViewContent {
  activityId: string;
  fieldId: string;
  newContents: string;
  longEdit: boolean;
  attachments: string[];
  setActivityRead: boolean;
}
