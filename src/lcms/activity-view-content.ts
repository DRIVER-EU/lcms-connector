import {ICAPAlert, createDefaultCAPMessage} from '../models/cap';

export interface IActivityViewContent {
  screenTitle: string;
  fields: IField[];
  id: string;
  viewCategory: string;
  viewHeaderName: string;
}

export interface IField {
  screenTitle: string;
  contents: string;
  id: string;
  description: string;
}

export class ActivityViewContent implements IActivityViewContent {
  constructor(public screenTitle: string, public fields: IField[], public id: string, public viewCategory: string, public viewHeaderName: string) {}

  public static fromObject(obj: IActivityViewContent) {
    return new ActivityViewContent(obj.screenTitle, obj.fields, obj.id, obj.viewCategory, obj.viewHeaderName);
  }

  public toCAPMessages(senderId: string) {
    let capMsg: ICAPAlert = createDefaultCAPMessage(senderId);
    capMsg.info.headline = this.screenTitle;
    capMsg.info.parameter = {valueName: 'LCMS-content', value: ''};
    capMsg.info.parameter.value = this.fields && this.fields.length ? this.fields[0].contents : 'No content found';
    return capMsg;
  }
}
