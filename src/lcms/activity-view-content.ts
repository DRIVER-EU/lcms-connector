import {ICAPAlert, createDefaultCAPMessage} from '../models/cap';

export interface IActivityViewContent {
  screenTitle: string;
  fields: IField[];
  id: string;
}

export interface IField {
  screenTitle: string;
  contents: string;
  id: string;
  description: string;
}

export class ActivityViewContent implements IActivityViewContent {
  constructor(public screenTitle: string, public fields: IField[], public id: string) {}

  public toCAPMessages(senderId: string) {
    let capMsg: ICAPAlert = createDefaultCAPMessage(senderId);
    capMsg.info.headline = this.screenTitle;
    capMsg.info.area.areaDesc = JSON.stringify(this.fields);
    return capMsg;
  }
}
