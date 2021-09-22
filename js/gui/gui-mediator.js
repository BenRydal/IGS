class GUI {

    constructor(sketch) {
        this.sk = sketch;
        this.timelinePanel = new TimelinePanel(this.sk);
        this.dataPanel = new DataPanel(this.sk, this.timelinePanel.getBottom());
        this.fpContainer = new FloorPlanContainer(this.sk, this.timelinePanel.getStart(), this.timelinePanel.getEnd(), this.timelinePanel.getHeight());
        this.keyTextSize = this.sk.width / 70;
    }

    drawGUI(pathList, speakerList) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize(this.sk.DRAWGUI, pathList, speakerList); // pass these to dynamically update
        this.timelinePanel.draw();
        this.fpContainer.updateSelectors(this.dataPanel.getCurSelectTab());
        this.timelinePanel.updateSlicer(this.sk.sketchController.handle3D.getIsShowing());
        if (this.sk.sketchController.getIsIntro()) this.sk.translateCanvasForText(this.drawIntroMsg.bind(this));
    }

    drawIntroMsg() {
        const introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan and a timeline and can be viewed in 2D or 3D. Use the top menu to visualize different sample datasets or upload your own data. Use the top and bottom left buttons as well as the timeline to selectively study displayed data. For example, you can animate data, visualize conversation in different ways, and interact with video data by clicking anywhere on the timeline to play & pause video. For more information see: benrydal.com/software/igs";
        this.sk.rectMode(this.sk.CENTER);
        this.sk.stroke(0);
        this.sk.strokeWeight(1);
        this.sk.fill(255, 240);
        this.sk.rect(this.sk.width / 2, this.sk.height / 2.5, this.sk.width / 1.75 + 50, this.sk.height / 1.75 + 50);
        this.sk.fill(0);
        this.sk.textSize(this.keyTextSize);
        this.sk.text(introMsg, this.sk.width / 2, this.sk.height / 2.5, this.sk.width / 1.75, this.sk.height / 1.75);
        this.sk.rectMode(this.sk.CORNER);
    }

    update3DSlicerRect() {
        this.timelinePanel.draw3DSlicerRect(this.fpContainer.getContainer(), this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX)); // pass mapped mouseX as zPos
    }

    handleDataPanel(pathList, speakerList) {
        this.sk.textSize(this.keyTextSize);
        this.dataPanel.organize(this.sk.HANDLEGUI, pathList, speakerList);
    }

    setRotateLeft() {
        this.sk.sketchController.setRotateLeft();
    }

    setRotateRight() {
        this.sk.sketchController.setRotateRight();
    }

    // NOTE: this setter is modifying core vars but this still seems to be best solution
    setCoreData(personFromList) {
        personFromList.isShowing = !personFromList.isShowing;
    }
}