class DrawMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.bug = { // represents user selection dot drawn in both floor plan and space-time views
            xPos: null, // number/float values
            yPos: null,
            timePos: null,
            size: this.sk.width / 50,
            lengthToCompare: this.sk.width // used to compare data points to find closest bug value
        };
        this.smallPathWeight = null;
        this.largePathWeight = null;
        this.colorGray = 150;
    }

    setData(path) {
        this.resetBug(); // always reset bug values
        this.setPathStyles();
        this.draw(this.sk.PLAN, path.movement, path.color);
        this.draw(this.sk.SPACETIME, path.movement, path.color);
        if (this.bug.xPos != null) this.drawBug(path.color); // if selected, draw bug
    }

    setPathStyles() {
        switch (this.sk.gui.getCurSelectTab()) {
            case 3:
                this.setPathStrokeWeights(1, 0);
                break;
            case 4:
                this.setPathStrokeWeights(0, 9);
                break;
            default:
                this.setPathStrokeWeights(1, 9);
                break;
        }
    }

    setPathStrokeWeights(small, large) {
        this.smallPathWeight = small;
        this.largePathWeight = large;
    }

    /**
     * Organizes path drawing depending on view (floor plan or space-time)
     * Path is separated into segments depending on test/highlight method (e.g., stops, cursor, slicer)
     * NOTE: Due to browser drawing methods, paths must be separated/segmented to change thickness or stroke
     * @param  {Integer} view
     * @param  {Path} path
     * @param  {Color} shade
     * @param  {string} test
     */

    // TODO: 1) change testCursor to cursorMode..., 2) create object to pass vars?
    draw(view, movementArray, shade) {
        this.setLineStyle(shade);
        let isThickLine = false; // mode controls how paths are segmented (begun/ended)
        this.sk.beginShape();
        // Start at 1 to test current and prior points for drawing start/end vertices correctly
        for (let i = 1; i < movementArray.length; i++) {
            const curPoint = this.sk.sketchController.getScaledPos(movementArray[i], view); // get current and prior points for comparison
            const priorPoint = this.sk.sketchController.getScaledPos(movementArray[i - 1], view);
            if (this.sk.sketchController.testPointIsShowing(curPoint)) {
                if (this.testFloorPlanStops(view, movementArray[i])) {
                    if (!movementArray[i - 1].isStopped) this.drawStopCircle(curPoint, shade); // only draw stopped point once
                } else {
                    if (this.testSelectMethod(curPoint, movementArray[i])) {
                        this.drawThickLine(isThickLine, curPoint, priorPoint, shade);
                        isThickLine = true;
                    } else {
                        this.drawThinLine(isThickLine, curPoint, priorPoint, shade);
                        isThickLine = false;
                    }
                }
                if (view === this.sk.SPACETIME) this.testPointForBug(curPoint.selTimelineXPos, curPoint.floorPlanXPos, curPoint.floorPlanYPos);
            }
        }
        this.sk.endShape(); // end shape in case still drawing
    }

    testFloorPlanStops(view, point) {
        return view === this.sk.PLAN && point.isStopped && this.sk.gui.getCurSelectTab() !== 3;
    }

    drawStopCircle(curPoint, shade) {
        this.sk.fill(shade);
        this.sk.circle(curPoint.viewXPos, curPoint.floorPlanYPos, 9);
        this.sk.noFill();
    }

    testSelectMethod(curPoint, point) {
        if (this.sk.gui.getCurSelectTab() === 1) return this.sk.gui.overCursor(curPoint.floorPlanXPos, curPoint.floorPlanYPos);
        else if (this.sk.gui.getCurSelectTab() === 2) return this.sk.gui.overSlicer(curPoint.floorPlanXPos, curPoint.floorPlanYPos);
        else return point.isStopped;
    }

    drawThickLine(isThickLine, curPoint, priorPoint, shade) {
        if (isThickLine) this.sk.vertex(curPoint.viewXPos, curPoint.floorPlanYPos); // if already drawing in highlight mode, continue it
        else this.startNewLine(priorPoint, this.largePathWeight, shade); // if not drawing in highlight mode, begin it
    }

    drawThinLine(isThickLine, curPoint, priorPoint, shade) {
        if (isThickLine) this.startNewLine(priorPoint, this.smallPathWeight, shade); // if drawing in highlight mode, end it
        else this.sk.vertex(curPoint.viewXPos, curPoint.floorPlanYPos);
    }


    setLineStyle(lineColor) {
        this.sk.strokeWeight(this.smallPathWeight);
        this.sk.stroke(lineColor);
        this.sk.noFill(); // important for curve drawing
    }

    /**
     * Ends and begins a new drawing shape
     * Draws two vertices to indicate starting and ending points
     * Sets correct strokeweight and this.sk.stroke depending on parameters for new shape
     * @param  {Object returned from getScaledPos} scaledPoint
     * @param  {Integer} weight
     * @param  {Color} shade
     */
    startNewLine(scaledPoint, weight, shade) {
        this.sk.vertex(scaledPoint.viewXPos, scaledPoint.floorPlanYPos); // draw cur point twice to mark end point
        this.sk.vertex(scaledPoint.viewXPos, scaledPoint.floorPlanYPos);
        this.sk.endShape();
        this.sk.strokeWeight(weight);
        this.sk.stroke(shade);
        this.sk.beginShape();
        this.sk.vertex(scaledPoint.viewXPos, scaledPoint.floorPlanYPos); // draw cur point twice to mark starting point
        this.sk.vertex(scaledPoint.viewXPos, scaledPoint.floorPlanYPos);
    }

    testPointForBug(scaledTimeToTest, xPos, yPos) {
        if (this.sk.sketchController.mode.isAnimate) this.recordBug(scaledTimeToTest, xPos, yPos, null); // always return true to set last/most recent point as the bug
        else if (this.sk.sketchController.mode.isVideoPlay) {
            const selTime = this.sk.sketchController.mapFromVideoToSelectedTime();
            if (this.compareValuesBySpacing(selTime, scaledTimeToTest, this.bug.lengthToCompare)) this.recordBug(scaledTimeToTest, xPos, yPos, Math.abs(selTime - scaledTimeToTest));
        } else if (this.sk.gui.overSpaceTimeView(this.sk.mouseX, this.sk.mouseY) && this.compareValuesBySpacing(this.sk.mouseX, scaledTimeToTest, this.bug.lengthToCompare)) this.recordBug(this.sk.mouseX, xPos, yPos, Math.abs(this.sk.mouseX - scaledTimeToTest));
    }

    compareValuesBySpacing(value1, value2, spacing) {
        return value1 >= value2 - spacing && value1 <= value2 + spacing;
    }

    resetBug() {
        this.bug.xPos = null;
        this.bug.yPos = null;
        this.bug.timePos = null;
        this.bug.lengthToCompare = this.sk.width;
    }

    recordBug(timePos, xPos, yPos, lengthToCompare) {
        this.bug.xPos = xPos;
        this.bug.yPos = yPos;
        this.bug.timePos = timePos;
        this.bug.lengthToCompare = lengthToCompare;
        this.sk.sketchController.bugTimeForVideoScrub = timePos;
    }

    drawBug(shade) {
        this.sk.stroke(0);
        this.sk.strokeWeight(5);
        this.sk.fill(shade);
        this.sk.ellipse(this.bug.xPos, this.bug.yPos, this.bug.size, this.bug.size);
        this.sk.ellipse(this.bug.timePos, this.bug.yPos, this.bug.size, this.bug.size);
    }
}