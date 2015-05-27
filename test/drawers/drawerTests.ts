///<reference path="../testReference.ts" />

class MockAnimator implements Plottable.Animators.Plot {
  private _time: number;
  private _callback: Function;
  constructor(time: number, callback?: Function) {
    this._time = time;
    this._callback = callback;
  }
  public getTiming(selection: any) {
    return this._time;
  }

  public animate(selection: any, attrToProjector: Plottable.AttributeToProjector): any {
    if (this._callback) {
      this._callback();
    }
    return selection;
  }
}

class MockDrawer extends Plottable.Drawers.AbstractDrawer {
  public _drawStep(step: Plottable.Drawers.DrawStep) {
    step.animator.animate(this._getRenderArea(), step.attrToProjector);
  }
}

describe("Drawers", () => {
  describe("Abstract Drawer", () => {
    var oldTimeout: any;
    var timings: number[] = [];
    var svg: D3.Selection;
    var drawer: MockDrawer;
    before(() => {
      oldTimeout = Plottable.Utils.Methods.setTimeout;
      Plottable.Utils.Methods.setTimeout = function(f: Function, time: number, ...args: any[]) {
        timings.push(time);
        return oldTimeout(f, time, args);
      };
    });

    after(() => {
      Plottable.Utils.Methods.setTimeout = oldTimeout;
    });

    beforeEach(() => {
      timings = [];
      svg = TestMethods.generateSVG();
      drawer = new MockDrawer("foo");
      drawer.setup(svg);
    });

    afterEach(() => {
      svg.remove(); // no point keeping it around since we don't draw anything in it anyway
    });

    it("drawer timing works as expected for null animators", () => {
      var a1 = new Plottable.Animators.Null();
      var a2 = new Plottable.Animators.Null();
      var ds1: Plottable.Drawers.DrawStep = {attrToProjector: {}, animator: a1};
      var ds2: Plottable.Drawers.DrawStep = {attrToProjector: {}, animator: a2};
      var steps = [ds1, ds2];
      drawer.draw([], steps, null);
      assert.deepEqual(timings, [0, 0], "setTimeout called twice with 0 time both times");
    });

    it("drawer timing works for non-null animators", (done) => {
      var callback1Called = false;
      var callback2Called = false;
      var callback1 = () => {
        callback1Called = true;
      };
      var callback2 = () => {
        assert.isTrue(callback1Called, "callback2 called after callback 1");
        callback2Called = true;
      };
      var callback3 = () => {
        assert.isTrue(callback2Called, "callback3 called after callback 2");
        done();
      };
      var a1 = new MockAnimator(20, callback1);
      var a2 = new MockAnimator(10, callback2);
      var a3 = new MockAnimator(0, callback3);
      var ds1: Plottable.Drawers.DrawStep = {attrToProjector: {}, animator: a1};
      var ds2: Plottable.Drawers.DrawStep = {attrToProjector: {}, animator: a2};
      var ds3: Plottable.Drawers.DrawStep = {attrToProjector: {}, animator: a3};
      var steps = [ds1, ds2, ds3];
      drawer.draw([], steps, null);
      assert.deepEqual(timings, [0, 20, 30], "setTimeout called with appropriate times");
    });

    it("_getSelection", () => {
      var svg = TestMethods.generateSVG(300, 300);
      var drawer = new Plottable.Drawers.AbstractDrawer("test");
      drawer.setup(svg.append("g"));
      (<any> drawer)._getSelector = () => "circle";
      var data = [{one: 2, two: 1}, {one: 33, two: 21}, {one: 11, two: 10}];
      var circles = drawer._getRenderArea().selectAll("circle").data(data);
      circles.enter().append("circle").attr("cx", (datum: any) => datum.one).attr("cy", (datum: any) => datum.two).attr("r", 10);
      var selection = drawer._getSelection(1);
      assert.strictEqual(selection.node(), circles[0][1], "correct selection gotten");
      svg.remove();
    });
  });
});
