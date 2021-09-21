/*
CREDITS/LICENSE INFORMATION: 
This software is written in JavaScript and p5.js and uses YouTube and Kaltura Video Player APIs and the PapaParse library by Matt Holt for CSV file processing. 
This software is licensed under the GNU General Public License Version 2.0. 
See the GNU General Public License included with this software for more details. 
Classroom discussion example data is used with special permission from Mathematics Teaching and Learning to Teach (MTLT), 
University of Michigan. (2010). Sean Numbers-Ofala. Classroom science lesson data is made possible by the researchers 
and teachers who created The Third International Mathematics and Science Study (TIMSS) 1999 Video Study. 
IGS software was originally developed by Ben Rydal Shapiro at Vanderbilt University 
as part of his dissertation titled Interaction Geography & the Learning Sciences. 
Copyright (C) 2018 Ben Rydal Shapiro, and contributors. 
To reference or read more about this work please see: 
https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

const igs = new p5((sk) => {

    sk.preload = function () {
        sk.font_Lato = sk.loadFont("data/fonts/Lato-Light.ttf");
    }

    sk.setup = function () {
        sk.canvas = sk.createCanvas(window.innerWidth, window.innerHeight, sk.WEBGL);
        sk.smooth();
        sk.textFont(sk.font_Lato);
        sk.textAlign(sk.LEFT, sk.TOP);
        // SINGLETONS
        sk.core = new Core(sk);
        sk.gui = new GUI(sk);
        sk.domController = new DomController(sk); // handles DOM/buttons user interaction
        sk.sketchController = new SketchController(sk); // coordinates calls across classes
        sk.videoPlayer = null; // abstract class for different video classes
        // CONSTANTS
        sk.PLAN = 0;
        sk.SPACETIME = 1;
        sk.DRAWGUI = 0;
        sk.HANDLEGUI = 1;
    }

    sk.draw = function () {
        sk.translate(-sk.width / 2, -sk.height / 2, 0); // always recenter canvas to top left when using WEBGL renderer
        sk.sketchController.update3DTranslation();
        sk.background(255);
        if (sk.dataIsLoaded(sk.core.inputFloorPlan.getImg())) sk.sketchController.setFloorPlan();
        if (sk.arrayIsLoaded(sk.core.pathList)) {
            if (sk.arrayIsLoaded(sk.core.speakerList)) sk.setMovementAndConversation();
            else sk.setMovement();
        }
        if (sk.sketchController.testVideoAndDivAreLoaded()) sk.sketchController.updateVideoDisplay();
        if (sk.sketchController.view3D.getIsShowing()) sk.gui.update3DSlicerRect();
        if (sk.sketchController.translationComplete()) sk.pop();
        sk.gui.drawKeys(sk.core.pathList, sk.core.speakerList); // draw keys last
        sk.sketchController.updateAnimation();
        sk.sketchController.updateLoop();
    }

    // For text in 2D, must translate 1 pixel so text is readable when using WebGL renderer
    sk.translateCanvasForText = function (callback) {
        sk.push();
        sk.translate(0, 0, 1);
        callback();
        sk.pop();
    }

    sk.translateCanvasTo3D = function (curPos) {
        sk.push();
        sk.translate(curPos.xPos, curPos.yPos, curPos.zoom);
        sk.rotateX(curPos.rotateX);
    }

    sk.drawFloorPlan = function (width, height) {
        sk.image(sk.core.inputFloorPlan.getImg(), 0, 0, width, height);
    }

    sk.drawRotatedFloorPlan = function (angle, width, height, container) {
        sk.push();
        sk.imageMode(sk.CENTER); // important method to include here
        sk.translate(container.width / 2, container.height / 2);
        sk.rotate(angle);
        sk.drawFloorPlan(width, height);
        sk.pop();
    }

    sk.setMovement = function () {
        const drawMovement = new DrawMovement(sk);
        for (const path of sk.core.pathList) {
            if (path.isShowing) drawMovement.setData(path); // draw after conversation so bug displays on top
        }
    }

    sk.setMovementAndConversation = function () {
        const drawConversation = new DrawConversation(sk);
        const drawMovement = new DrawMovement(sk);
        for (const path of sk.core.pathList) {
            if (path.isShowing) {
                drawConversation.setData(path, sk.core.speakerList);
                drawMovement.setData(path); // draw after conversation so bug displays on top
            }
        }
        drawConversation.setConversationBubble(); // draw conversation text last so it displays on top
    }

    sk.mousePressed = function () {
        sk.sketchController.handleMousePressed();
        sk.loop();
    }

    sk.mouseDragged = function () {
        sk.sketchController.handleMouseDragged();
        sk.loop();
    }
    sk.mouseReleased = function () {
        sk.sketchController.handleMouseReleased();
        sk.loop();
    }
    sk.mouseMoved = function () {
        sk.loop();
    }

    sk.overCircle = function (x, y, diameter) {
        return sk.sqrt(sk.sq(x - sk.mouseX) + sk.sq(y - sk.mouseY)) < diameter / 2;
    }

    sk.overRect = function (x, y, boxWidth, boxHeight) {
        return sk.mouseX >= x && sk.mouseX <= x + boxWidth && sk.mouseY >= y && sk.mouseY <= y + boxHeight;
    }

    /**
     * @param  {Any Type} data
     */
    sk.dataIsLoaded = function (data) {
        return data != null; // in javascript this tests for both undefined and null values
    }

    /**
     * @param  {Any Type} data
     */
    sk.arrayIsLoaded = function (data) {
        return Array.isArray(data) && data.length;
    }
});