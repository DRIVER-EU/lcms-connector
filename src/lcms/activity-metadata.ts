export interface IActivityMetadata {
  id: string;
}

export class ActivityMetadata implements IActivityMetadata {
  constructor(public id: string) {}

  public static fromObject(obj: IActivityMetadata) {
    return new ActivityMetadata(obj.id);
  }
}
