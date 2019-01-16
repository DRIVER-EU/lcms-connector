export class Activity {
  constructor(public activity_id: string, public title: string, public last_change: number, public secluded: boolean) {}

  public static fromObject(obj: Activity) {
    return new Activity(obj.activity_id, obj.title, obj.last_change, obj.secluded);
  }
}

/*
    var Activity = function() {
        function Activity(activity_id, title, last_change, secluded) {
            this.activity_id = activity_id, this.title = title, this.last_change = last_change, this.secluded = secluded
        }
        return Activity.fromObject = function(obj) {
            return $.extend(!0, obj, Activity.prototype)
        }, Activity

*/