class Handlers {

    constructor() {
        this.lockedLeft = false;
        this.lockedRight = false;
        this.selPadding = 20; // cushion for user selection on timeline
    }

    overCircle(x, y, diameter) {
        return sqrt(sq(x - mouseX) + sq(y - mouseY)) < diameter / 2;
    }

    overRect(x, y, boxWidth, boxHeight) {
        return mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight;
    }

    /**
     * Organizes mousePressed method calls for video, movement/conversation and interaction BUTTON_NAMES and path/speaker keys
     */
    handleMousePressed() {
        // Controls video when clicking over timeline region
        if (core.isModeVideoShowing && !core.isModeAnimate && handlers.overRect(keys.timelineStart, 0, keys.timelineEnd, keys.yPosTimelineBottom)) this.playPauseMovie();
        this.overMovementConversationButtons();
        this.overInteractionButtons();
        if (core.isModeMovement) this.overPathKeys();
        else this.overSpeakerKeys();
    }

    /**
     * Organizes timeline GUI methods. this.selPadding used to provide additionl "cushion" for mouse.
     * NOTE: To activate timeline methods, core.isModeAnimate mode must be false and 
     * Either mouse already dragging over timeline OR mouse cursor is over timeline bar.
     */
    handleMouseDragged() {
        if (!core.isModeAnimate && ((this.lockedLeft || this.lockedRight) || handlers.overRect(keys.timelineStart - this.selPadding, keys.yPosTimelineTop, keys.timelineLength + this.selPadding, keys.timelineThickness))) this.handleTimeline();
    }

    /**
     * Set locked global vars to false to be able to re-engage timeline GUI methods
     */
    handleMouseReleased() {
        this.lockedLeft = false;
        this.lockedRight = false;
    }

    /**
     * Toggles on and off global showMovement var to determine if movement or conversation keys show
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overMovementConversationButtons() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart;
        if (handlers.overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + textWidth("Movement"), keys.buttonWidth)) core.isModeMovement = true;
        else if (handlers.overRect(currXPos + textWidth("Movement | "), keys.speakerKeysHeight, keys.buttonWidth + textWidth("Conversation"), keys.buttonWidth)) core.isModeMovement = false;
    }

    /**
     * Iterate over global core.speakerList and test if mouse is over any of speaker keys and update speaker accordingly
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overSpeakerKeys() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + textWidth("Movement | Conversation") + keys.buttonWidth;
        for (let i = 0; i < core.speakerList.length; i++) {
            let nameWidth = textWidth(core.speakerList[i].name); // set nameWidth to pixel width of speaker code
            if (handlers.overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) core.speakerList[i].show = !core.speakerList[i].show;
            currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
        }
    }

    /**
     * Iterate over global core.paths list and test if mouse is over any of core.paths and update accordingly
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overPathKeys() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + textWidth("Movement | Conversation") + keys.buttonWidth;
        for (let i = 0; i < core.paths.length; i++) {
            const nameWidth = textWidth(core.paths[i].name); // set nameWidth to pixel width of path name
            if (handlers.overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) core.paths[i].show = !core.paths[i].show;
            currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
        }
    }

    /**
     * Iterate over each interaction button and toggle boolean or call corresponding gui method for button
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overInteractionButtons() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + keys.buttonSpacing / 2;
        if (handlers.overRect(currXPos, keys.buttonsHeight, textWidth(BUTTON_NAMES[0]), keys.buttonWidth)) this.overAnimateButton();
        else if (handlers.overRect(currXPos + textWidth(BUTTON_NAMES[0]) + 2 * keys.buttonSpacing, keys.buttonsHeight, textWidth(BUTTON_NAMES[1]) + keys.buttonSpacing, keys.buttonWidth)) core.isModeAlignTalkTop = !core.isModeAlignTalkTop;
        else if (handlers.overRect(currXPos + textWidth(BUTTON_NAMES[0] + BUTTON_NAMES[1]) + 4 * keys.buttonSpacing, keys.buttonsHeight, textWidth(BUTTON_NAMES[2]) + keys.buttonSpacing, keys.buttonWidth)) core.isModeAllTalkOnPath = !core.isModeAllTalkOnPath;
        else if (testData.dataIsLoaded(videoPlayer) && handlers.overRect(currXPos + textWidth(BUTTON_NAMES[0] + BUTTON_NAMES[1] + BUTTON_NAMES[2]) + 6 * keys.buttonSpacing, keys.buttonsHeight, textWidth(BUTTON_NAMES[3]) + keys.buttonSpacing, keys.buttonWidth)) this.overVideoButton();
        else if (handlers.overRect(currXPos + textWidth(BUTTON_NAMES[0] + BUTTON_NAMES[1] + BUTTON_NAMES[2] + BUTTON_NAMES[3]) + 8 * keys.buttonSpacing, keys.buttonsHeight, textWidth(BUTTON_NAMES[4]) + keys.buttonSpacing, keys.buttonWidth)) core.isModeIntro = !core.isModeIntro;
    }

    /**
     * Toggle on and off core.isModeAnimate mode and set/end global core.isModeAnimate counter variable
     */
    overAnimateButton() {
        if (core.isModeAnimate) {
            core.isModeAnimate = false;
            core.animationCounter = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds); // set to keys.curPixelTimeMax mapped value
        } else {
            core.isModeAnimate = true;
            core.animationCounter = map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds); // set to keys.curPixelTimeMin mapped value
        }
    }

    /**
     * Updates keys.curPixelTimeMin or keys.curPixelTimeMax global variables depending on left or right selector that user is over
     * NOTE: Is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        const xPosLeftSelector = keys.curPixelTimeMin;
        const xPosRightSelector = keys.curPixelTimeMax;
        if (this.lockedLeft || (!this.lockedRight && handlers.overRect(xPosLeftSelector - this.selPadding, keys.yPosTimelineTop, 2 * this.selPadding, keys.timelineThickness))) {
            this.lockedLeft = true;
            keys.curPixelTimeMin = constrain(mouseX, keys.timelineStart, keys.timelineEnd);
            if (keys.curPixelTimeMin > keys.curPixelTimeMax - (2 * this.selPadding)) keys.curPixelTimeMin = keys.curPixelTimeMax - (2 * this.selPadding); // prevents overstriking
        } else if (this.lockedRight || handlers.overRect(xPosRightSelector - this.selPadding, keys.yPosTimelineTop, 2 * this.selPadding, keys.timelineThickness)) {
            this.lockedRight = true;
            keys.curPixelTimeMax = constrain(mouseX, keys.timelineStart, keys.timelineEnd);
            if (keys.curPixelTimeMax < keys.curPixelTimeMin + (2 * this.selPadding)) keys.curPixelTimeMax = keys.curPixelTimeMin + (2 * this.selPadding); // prevents overstriking
        }
    }

    /**
     * Toggle whether video is playing and whether video is showing
     * NOTE: this is different than playPauseMovie method
     */
    overVideoButton() {
        if (core.isModeVideoShowing) {
            videoPlayer.pause();
            videoPlayer.hide();
            core.isModeVideoPlaying = false; // important to set this
        } else {
            videoPlayer.show();
        }
        core.isModeVideoShowing = !core.isModeVideoShowing; // set after testing
    }

    /**
     * Plays/pauses movie and updates videoPlayhead if setting to play
     * Also toggles global core.isModeVideoPlaying variable
     */
    playPauseMovie() {
        if (core.isModeVideoPlaying) {
            videoPlayer.pause();
            core.isModeVideoPlaying = false;
        } else {
            // first map mouse to selected time values in GUI
            const mapMousePos = map(mouseX, keys.timelineStart, keys.timelineEnd, keys.curPixelTimeMin, keys.curPixelTimeMax);
            // must floor vPos to prevent double finite error
            const videoPos = Math.floor(map(mapMousePos, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
            videoPlayer.play();
            videoPlayer.seekTo(videoPos);
            core.isModeVideoPlaying = true;
        }
    }
}