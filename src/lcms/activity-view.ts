import {createDefaultCAPMessage, ICAPAlert} from '../models/cap';

export interface IActivityView {
  id: string;
  domainCode: string;
  organizationCode: string;
  screenTitle: string;
  alias: string;
  templateId: string;
  position: number;
  read: boolean;
  customPage: boolean;
  empty: boolean;
  sourceActivityId: string;
  viewCategory: string;
  viewHeaderId: number;
  viewHeaderName: string;
  lastChangeTime: number;
  lastStructuralChangeTime: number;
  visible: boolean;
}

export class ActivityView implements IActivityView {
  constructor(
    public id: string,
    public domainCode: string,
    public organizationCode: string,
    public screenTitle: string,
    public alias: string,
    public templateId: string,
    public position: number,
    public read: boolean,
    public customPage: boolean,
    public empty: boolean,
    public sourceActivityId: string,
    public viewCategory: string,
    public viewHeaderId: number,
    public viewHeaderName: string,
    public lastChangeTime: number,
    public lastStructuralChangeTime: number,
    public visible: boolean
  ) {}

  public static fromObject(obj: IActivityView) {
    return new ActivityView(
      obj.id,
      obj.domainCode,
      obj.organizationCode,
      obj.screenTitle,
      obj.alias,
      obj.templateId,
      obj.position,
      obj.read,
      obj.customPage,
      obj.empty,
      obj.sourceActivityId,
      obj.viewCategory,
      obj.viewHeaderId,
      obj.viewHeaderName,
      obj.lastChangeTime,
      obj.lastStructuralChangeTime,
      obj.visible
    );
  }

  public toCAPMessages(senderId: string) {
    let capMsg: ICAPAlert = createDefaultCAPMessage(senderId);
    capMsg.info.headline = this.screenTitle;
    capMsg.info.area.areaDesc = this.viewCategory;
    return capMsg;
  }
}
