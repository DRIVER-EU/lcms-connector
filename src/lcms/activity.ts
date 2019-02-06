export class Activity {
  constructor(public id: string, public name: string, public modified: number, public read: boolean) {}

  public static fromObject(obj: Activity) {
    return new Activity(obj.id, obj.name, obj.modified, obj.read);
  }
}
