/**
 * This class holds different tests and helper methods used in draw movement and conversation classes
 * It centralizes decisions about what points to show and not show and is coupled with the sketchController/gui classes
 */
class TestPoint {

    constructor(sketch) {
        this.sk = sketch;
    }

    isShowingInGUI(pixelTime) {
        return this.sk.gui.timelinePanel.overAxis(pixelTime) && this.isShowingInAnimation(pixelTime);
    }

    isShowingInAnimation(value) {
        if (this.sk.sketchController.getIsAnimate()) return this.sk.sketchController.animationCounter > this.sk.sketchController.mapPixelTimeToTotalTime(value);
        else return true;
    }

    /**
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint
     */
    isPlanViewAndStopped(view, pointIsStopped) {
        return (view === this.sk.PLAN && pointIsStopped && this.sk.gui.dataPanel.getCurSelectTab() !== 3);
    }

    /**
     * This method tests if a point is showing for all selected codes from codeList
     * IMPLEMENTATION: Iterate through core codeList and return false if: for any of codes that are true in codeList a code at curPoint is false 
     * @param  {MovementPoint} point
     */
    isShowingInCodeList(codesArray) {
        if (this.sk.arrayIsLoaded(this.sk.core.codeList)) {
            for (let j = 0; j < this.sk.core.codeList.length; j++) {
                if (this.sk.core.codeList[j].isShowing) {
                    if (codesArray[j]) continue;
                    else return false;
                }
            }
        }
        return true;
    }

    /**
     * Currently returns whether color by paths/people is selected in GUI
     */
    getColorMode() {
        return this.sk.gui.dataPanel.getCurColorTab() === 0;
    }

    /**
     * Returns scaled pixel values for a point to graphical display
     * IMPORTANT: currently view parameter can be either one of 2 constants or "null" for conversation drawing
     * @param  {Movement Or Conversation Point} point
     * @param  {Integer} view
     */
    getSharedPosValues(point) {
        const timelineXPos = this.sk.sketchController.mapTotalTimeToPixelTime(point.time);
        const selTimelineXPos = this.sk.sketchController.mapSelectTimeToPixelTime(timelineXPos);
        const [floorPlanXPos, floorPlanYPos] = this.sk.sketchController.handleRotation.getScaledXYPos(point.xPos, point.yPos, this.sk.gui.fpContainer.getContainer(), this.sk.core.inputFloorPlan.getParams());
        return {
            timelineXPos,
            selTimelineXPos,
            floorPlanXPos,
            floorPlanYPos,
        };
    }

    /**
     * Controls fat line drawing/segmentation
     * @param  {Object returned from getScaledMovementPos} pos
     * @param  {MovementPoint} point
     */
    selectModeForFatLine(pos, pointIsStopped) {
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 1:
                return this.sk.gui.fpContainer.overCursor(pos.floorPlanXPos, pos.floorPlanYPos);
            case 2:
                return this.sk.gui.fpContainer.overSlicer(pos.floorPlanXPos, pos.floorPlanYPos);
            default:
                return pointIsStopped; // this always returns false for floorplan view
        }
    }
    /**
     * Controls conversation drawing based on selectMode
     * @param  {Object returned from getScaledConversationPos} pos
     * @param  {MovementPoint} point
     */
    selectModeForConversation(xPos, yPos, isStopped) {
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 0:
                return true;
            case 1:
                return this.sk.gui.fpContainer.overCursor(xPos, yPos);
            case 2:
                return this.sk.gui.fpContainer.overSlicer(xPos, yPos);
            case 3:
                return !isStopped;
            case 4:
                return isStopped;
        }
    }

    selectModeForStrokeWeights() {
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 3:
                return [1, 0];
            case 4:
                return [0, 9];
            default:
                return [1, 9];
        }
    }
}