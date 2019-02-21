export interface ILCMSContent {
  tabTitle: string;
  fieldTitle: string;
  content: string;
}


export function createLCMSContent(tabTitle: string, fieldTitle: string, content: string = 'No content') {
    return {tabTitle: tabTitle, fieldTitle: fieldTitle, content: content} as ILCMSContent;
  }